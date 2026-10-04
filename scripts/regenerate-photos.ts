// Rebuilds the served image variants for every stored photo from its master.
// Run after changing the presets in src/lib/images/process.ts:
//   npm run photos:regenerate            # every photo
//   npm run photos:regenerate -- <id>    # one photo
import { PrismaClient } from "@prisma/client";

import { getStorage } from "../src/lib/adapters/storage";
import { regenerateVariants } from "../src/lib/images/regenerate";
import type { StoredVariant } from "../src/lib/images/view";

const prisma = new PrismaClient();

async function main() {
  const only = process.argv[2];
  const photos = await prisma.listingPhoto.findMany({ where: only ? { id: only } : {} });
  console.log(`Regenerating ${photos.length} photo(s)…`);

  let failed = 0;
  for (const photo of photos) {
    try {
      const result = await regenerateVariants(getStorage(), {
        id: photo.id,
        listingId: photo.listingId,
        kind: photo.kind,
        masterKey: photo.masterKey,
        variants: photo.variants as StoredVariant[],
      });
      await prisma.listingPhoto.update({
        where: { id: photo.id },
        data: { variants: result.variants, placeholder: result.placeholder },
      });
      console.log(`  ok   ${photo.id} (${result.variants.length} files)`);
    } catch (error) {
      failed++;
      console.error(
        `  FAIL ${photo.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  if (failed) process.exitCode = 1;
}

main().finally(() => prisma.$disconnect());
