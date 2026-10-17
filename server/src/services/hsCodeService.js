const prisma = require("../lib/prisma");

// Pure function: given a list of mappings and a description, picks
// the best (longest keyword) match. No DB access — easy to unit test.
function pickBestMatch(mappings, productDescription) {
  const description = productDescription.toLowerCase();
  let best = null;

  for (const mapping of mappings) {
    const keyword = mapping.keyword.toLowerCase();
    if (description.includes(keyword)) {
      if (!best || keyword.length > best.keyword.length) {
        best = { ...mapping, keyword };
      }
    }
  }

  return best ? best.hsCode : null;
}

// DB-backed wrapper used by the app.
async function classify(productDescription) {
  const mappings = await prisma.hsCodeMapping.findMany();
  return pickBestMatch(mappings, productDescription);
}

module.exports = { classify, pickBestMatch };
