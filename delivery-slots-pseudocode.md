# Task 2: Handling Delivery Slots — Detailed Pseudocode

## 1. Data Model

```
DeliverySlot {
  slotId:        string    # unique identifier (e.g. "2026-08-22-10-12")
  date:          date      # YYYY-MM-DD
  startTime:     datetime  # slot start
  endTime:       datetime  # slot end
  capacity:      integer   # max number of orders this slot can hold
  bookedCount:   integer   # current number of confirmed reservations
  isActive:      boolean   # slot can be offered to customers
}

Booking {
  bookingId:       string    # unique
  orderId:         string
  customerId:      string
  slotId:          string    # reference to DeliverySlot
  status:          enum      # HELD | CONFIRMED | CANCELLED
  idempotencyKey:  string    # client-generated, prevents duplicate booking on retry
  createdAt:       timestamp
}

```

> `bookedCount` is the single source of truth for availability:
> `slot is available  <=>  bookedCount < capacity`.
> It is NEVER incremented by plain read-modify-write. It is only mutated by the
> atomic operation in `reserveSlotAtomically` below.

---

## 2. Atomic Reservation (Prevents Overbooking)

This is the heart of the solution. Under concurrency, two requests must not both
reserve the last remaining seat. The DB guarantees the check-and-increment is a
single atomic unit.

```
function reserveSlotAtomically(slotId):
    result = database.update(
        filter = {
            slotId: slotId,
            isActive: true,
            bookedCount < capacity,        // Condition: seat must be available
            startTime > now                // Slots in the past cannot be booked
        },
        update = { increment: { bookedCount: 1 } }
    )
    return result.affectedRows == 1        // true if reserved, false if full/inactive/past
```

example:
MongoDB | `findOneAndUpdate({slotId, bookedCount: {$lt: capacity}}, {$inc: {bookedCount: 1}})` — returns `null` if full.

---

## 3. Main Booking Flow

```
function bookDeliverySlot(customerId, orderId, preferredSlotId, idempotencyKey):

    // --- Idempotency: prevents duplicate bookings on retries
    existing = database.findOne("bookings", { idempotencyKey })
    if existing exists:
        return success(existing, "Already processed")

    // --- Validate preferred slot exists
    slot = database.findOne("slots", { slotId: preferredSlotId })
    if slot is null:
        return error("Slot not found", 404)

    // --- Try atomic reservation (no retry needed unless transient error)
    reserved = reserveSlotAtomically(preferredSlotId)

    if reserved == true:
        booking = createBooking(customerId, orderId, preferredSlotId, idempotencyKey, "CONFIRMED")
        return success(booking, "Delivery slot confirmed")

    // --- Reservation failed -> suggest alternatives
    alternatives = findAlternativeSlots(preferredSlotId, limit = 3)
    return error("Preferred slot is full or unavailable", 409, alternatives)
```

---

## 4. Alternative Slots Suggestion

The goal: return the closest available options so the customer has a smooth,
near-zero-friction path to still book. Ranking considers **time proximity** and
**remaining capacity**.

```
function findAlternativeSlots(preferredSlotId, limit):

    preferred = database.findOne("slots", { slotId: preferredSlotId })
    if preferred is null:
        return []

    // Same day, same zone (if needed), active, future, and still have capacity
    candidates = database.find("slots", {
        date: preferred.date,
        isActive: true,
        startTime > now,
        bookedCount < capacity,        // only available slots
        slotId != preferredSlotId
    })

    sort candidates by:
        abs(startTime - preferred.startTime) ascending,   // closest time
        (capacity - bookedCount) descending               // more remaining seats

    return first `limit` candidates
```

---

## 5. Availability Endpoint (for UI: clickable vs disabled)

The app calls this to render slots. Fully-booked slots are returned with
`available = false` so the UI disables them (as described in the example flow).

```
function getAvailableSlots(date):

    slots = database.find("slots", {
        date: date,
        isActive: true,
        startTime > now
    })

    result = []
    for slot in slots:
        slot.available = (slot.bookedCount < slot.capacity)
        slot.remaining = slot.capacity - slot.bookedCount
        result.append(slot)

    return result
```

---

## 6. Cancellation (Releases capacity safely)

Frees capacity so other customers can book. Must be idempotent and must never
drive `bookedCount` below zero.

```
function cancelBooking(bookingId):

    booking = database.findOne("bookings", { bookingId })
    if booking is null:
        return error("Booking not found", 404)

    if booking.status == "CANCELLED":
        return success("Already cancelled")    // Idempotent

    // Atomic decrement with floor of 0 (prevents negative counts)
    database.update(
        "slots",
        { slotId: booking.slotId, bookedCount > 0 },
        { increment: { bookedCount: -1 } }
    )

    database.update("bookings", { bookingId }, { status: "CANCELLED" })

    return success("Cancelled, slot released")
```
