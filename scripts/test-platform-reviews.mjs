import assert from "node:assert/strict";
import {
    PLATFORM_REVIEWS,
    getPlatformReview,
    getAllPlatformReviewSlugs,
    SHARED_REVIEW_FAQS,
} from "../src/lib/platform-reviews-data.ts";

console.log("Testing Platform Review Data & Template Contract...");

const slugs = getAllPlatformReviewSlugs();
assert.ok(slugs.length >= 9, "Must have at least 9 platform reviews");
assert.ok(slugs.includes("earnlab"), "Must include earnlab");
assert.ok(slugs.includes("gemsloot"), "Must include gemsloot");
assert.ok(slugs.includes("kashkick"), "Must include kashkick");
assert.ok(slugs.includes("swagbucks"), "Must include swagbucks");

for (const slug of slugs) {
    const platform = await getPlatformReview(slug);
    assert.ok(platform, `Platform review for ${slug} should exist`);
    assert.equal(platform.slug, slug);
    assert.ok(platform.name.length > 0, `${slug} must have a name`);
    assert.ok(platform.logoUrl.length > 0, `${slug} must have a logoUrl`);
    assert.ok(platform.tagline.length > 0, `${slug} must have a tagline`);
    assert.ok(platform.rating >= 1 && platform.rating <= 5, `${slug} rating must be 1-5`);
    assert.ok(platform.updatedAt, `${slug} must have updatedAt`);

    // Key stats
    assert.ok(platform.stats.minCashout, `${slug} must have minCashout`);
    assert.ok(platform.stats.payoutSpeed, `${slug} must have payoutSpeed`);
    assert.ok(["Yes", "No", "Sometimes"].includes(platform.stats.kycRequired), `${slug} kycRequired must be Yes/No/Sometimes`);

    // Overview & methods
    assert.ok(platform.overview.length > 20, `${slug} must have an overview`);
    assert.ok(Array.isArray(platform.earningMethods) && platform.earningMethods.length > 0, `${slug} must have earningMethods`);
    assert.ok(Array.isArray(platform.payoutMethods) && platform.payoutMethods.length > 0, `${slug} must have payoutMethods`);
    assert.ok(platform.holdPeriodNote, `${slug} must have holdPeriodNote`);
    assert.ok(platform.kycNote, `${slug} must have kycNote`);

    // Countries, pros, cons, signup steps, FAQ
    assert.ok(Array.isArray(platform.countries) && platform.countries.length > 0, `${slug} must have countries`);
    assert.ok(Array.isArray(platform.pros) && platform.pros.length > 0, `${slug} must have pros`);
    assert.ok(Array.isArray(platform.cons) && platform.cons.length > 0, `${slug} must have cons`);
    assert.equal(platform.signupSteps.length, 4, `${slug} must have exactly 4 signup steps`);
    assert.ok(Array.isArray(platform.faq) && platform.faq.length > 0, `${slug} must have platform-specific faq`);
}

// Check non-existent returns null
const unknown = await getPlatformReview("non-existent-platform-xyz");
assert.equal(unknown, null, "Unknown slug should return null (triggers 404)");

// Check shared FAQs
assert.ok(SHARED_REVIEW_FAQS.length >= 3, "Shared FAQs should be populated");

console.log("All Platform Review validation checks passed successfully!");
