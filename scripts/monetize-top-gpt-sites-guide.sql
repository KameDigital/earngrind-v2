update public.guides
set
  body_md = replace(
    body_md,
    '<h2>How we ranked the top GPT sites</h2>',
    $block$
<h2>Recommended GPT sites to start with</h2>
<p>Use these tracked EarnGrind links when you are ready to compare a platform. We may earn a commission if you sign up, but that should not decide which site you use. Pick the route that fits your country, device, payout method, and time budget.</p>
<div class="guide-summary-box">
  <ul>
    <li><strong>Beginner cash path:</strong> <a href="/go/platform/kashkick?click_location=gpt_guide_recommended_start&source_context=top_gpt_sites_guide&platform_name=KashKick">Start KashKick</a> if you are an eligible U.S. user and want a simple cash-first path.</li>
    <li><strong>Mainstream rewards:</strong> <a href="/go/platform/swagbucks?click_location=gpt_guide_recommended_start&source_context=top_gpt_sites_guide&platform_name=Swagbucks">Start Swagbucks</a> if you want a broad rewards account for shopping, surveys, games, and PayPal or gift-card style redemptions.</li>
    <li><strong>Cash-style backup:</strong> <a href="/go/platform/inboxdollars?click_location=gpt_guide_recommended_start&source_context=top_gpt_sites_guide&platform_name=InboxDollars">Start InboxDollars</a> if you prefer seeing reward balances in dollars.</li>
    <li><strong>Survey backup:</strong> <a href="/go/platform/prizerebel?click_location=gpt_guide_recommended_start&source_context=top_gpt_sites_guide&platform_name=PrizeRebel">Start PrizeRebel</a> when you want more survey inventory.</li>
    <li><strong>Game/app backup:</strong> <a href="/go/platform/scrambly?click_location=gpt_guide_recommended_start&source_context=top_gpt_sites_guide&platform_name=Scrambly">Open Scrambly</a> and use referral code <strong>3P5OXUA</strong> where prompted.</li>
    <li><strong>Offerwall backups:</strong> <a href="/go/platform/gain-gg?click_location=gpt_guide_recommended_start&source_context=top_gpt_sites_guide&platform_name=Gain.gg">Open Gain.gg</a> or <a href="/go/platform/gemsloot?click_location=gpt_guide_recommended_start&source_context=top_gpt_sites_guide&platform_name=GemLoot">Open GemLoot</a> to compare alternate game payout routes.</li>
  </ul>
</div>

<h2>How we ranked the top GPT sites</h2>$block$
  ),
  editor_notes = coalesce(editor_notes || E'\n\n', '') || 'Monetization pass: added tracked /go/platform GPT CTA links and upserted affiliate platform rows.',
  updated_at = now()
where slug = 'best-gpt-sites-to-make-money'
  and body_md not like '%gpt_guide_recommended_start%';

select slug, title, status, content_status
from public.guides
where slug = 'best-gpt-sites-to-make-money';
