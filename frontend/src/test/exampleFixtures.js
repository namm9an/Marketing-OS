/** Controlled inputs for public demo-view tests, never provider captures. */
export function exampleFixture(agent = 'branding') {
  return {
    schema_version: 2, kind: 'illustrative-demo', agent,
    brief: `Controlled ${agent} service brief.`,
    result: `Controlled ${agent} recommendation.`,
    rationale: 'A controlled explanation of the recommendation.',
    considerations: 'Confirm the actual service terms.',
    review_required: agent === 'pr',
    sources: [{ id: 'ftc-green-guides', title: 'FTC: Environmental Claims — Summary of the Green Guides',
      url: 'https://www.ftc.gov/business-guidance/resources/environmental-claims-summary-green-guides',
      statement: 'Environmental claims should be specific and qualified.' }],
  };
}
