export function paginate(items, requestedPage = 1, pageSize = 5) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(
    pages,
    Math.max(1, Math.trunc(Number(requestedPage)) || 1),
  );
  const start = (page - 1) * pageSize;
  const numbers = [...new Set([1, page - 1, page, page + 1, pages])]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  return {
    total,
    pages,
    page,
    start: total ? start + 1 : 0,
    end: Math.min(start + pageSize, total),
    items: items.slice(start, start + pageSize),
    numbers,
  };
}
