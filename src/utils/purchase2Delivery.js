export function resolvePoDelivery(header = {}, stores = []) {
  const id = String(header.storeid || header.store || header.deliverylocation || ''), name = String(header.storename || header.store || header.deliverylocation || '').toLowerCase();
  const store = stores.find(row => String(row._id) === id) || stores.find(row => String(row.storename || '').toLowerCase() === name);
  if (!store) return { deliverylocation: /^[a-f\d]{24}$/i.test(header.storename || header.deliverylocation || '') ? 'Store not configured' : header.storename || header.deliverylocation || 'Store not configured', deliveryaddress: header.deliveryaddress || '', deliveryphone: header.deliveryphone || '', deliveryemail: header.deliveryemail || '', deliverycontactperson: header.deliverycontactperson || '' };
  return { storeid: String(store._id), storename: store.storename || store.name, store: store.storename || store.name, deliverylocation: store.storename || store.name, deliveryaddress: store.address || store.location || '', deliveryphone: store.contactnumber || store.phone || '', deliveryemail: store.email || '', deliverycontactperson: store.contactperson || store.storemanager || '' };
}
