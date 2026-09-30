const text = (v) => String(v ?? "").trim();
const key = (entry, recipient) => JSON.stringify([
  ...(recipient ? [text(entry.phone), text(entry.name), text(entry.phone2), text(entry.landmark)] : []),
  text(entry.province), text(entry.area), text(entry.address),
  entry.location ? Number(entry.location.lat).toFixed(6) : "",
  entry.location ? Number(entry.location.lng).toFixed(6) : "",
]);

// Keep each recipient/location combination, even when the phone number is shared.
export function rememberOrderPlaces(user, order, makeId) {
  user.addresses ??= [];
  user.customers ??= [];
  const sender = order.sender;
  if (sender?.address && sender.location) {
    let saved = user.addresses.find((a) => key({ province: user.province, ...a }, false) === key(sender, false));
    if (!saved) {
      saved = {
        id: makeId("ADR"), name: sender.area || sender.address,
        province: sender.province, area: sender.area, address: sender.address,
        location: structuredClone(sender.location),
      };
      user.addresses.push(saved);
    }
    sender.addressId = saved.id;
  }
  const recipient = order.recipient;
  if (recipient?.phone && recipient.name && recipient.address &&
      !user.customers.some((c) => key(c, true) === key(recipient, true))) {
    const { id: ignored, ...details } = recipient;
    user.customers.push({ ...structuredClone(details), id: makeId("CUS") });
  }
}
