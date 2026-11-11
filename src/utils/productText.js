/**
 * Products created through the bulk uploader and the partner portal store a
 * single "." when they have no description, because the backend requires the
 * field to be present. Rendering that straight gives the customer a lone dot
 * where a description should be, so treat it as empty everywhere.
 */
export const productDescription = (value) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text === '.' ? '' : text;
};

export default productDescription;
