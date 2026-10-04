import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isOrgAdminOrOwner } from "@/lib/utils/helperFunctions";

describe("isOrgAdminOrOwner", () => {
  it("recognizes OWNER and ADMIN as authorized managers", async () => {
    assert.equal(await isOrgAdminOrOwner("user-1", "org-1", "OWNER"), true);
    assert.equal(await isOrgAdminOrOwner("user-1", "org-1", "owner"), true);
    assert.equal(await isOrgAdminOrOwner("user-1", "org-1", "ADMIN"), true);
    assert.equal(await isOrgAdminOrOwner("user-1", "org-1", "admin"), true);
  });

  it("rejects MEMBER and unknown roles when cached role is provided", async () => {
    // Note: If cachedRole is MEMBER or invalid and DB returns no membership, it resolves to false
    assert.equal(await isOrgAdminOrOwner("user-1", "org-1", "MEMBER"), false);
    assert.equal(await isOrgAdminOrOwner("user-1", "org-1", "GUEST"), false);
  });
});
