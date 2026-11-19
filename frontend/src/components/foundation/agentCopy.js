// The brief summaries and process labels are editorial. Saved response bytes are kept in the catalog.
export const AGENT_COPY = {
  branding: {
    name: 'Branding',
    purpose: 'Find a clear position for your next launch.',
    brief: 'Recommend a positioning direction for Vanguard Cloud’s B200 launch.',
    deliverable: 'A positioning recommendation',
    steps: ['Read the audience and launch context.', 'Compare plausible positioning angles against the available evidence.', 'Return a positioning statement with the sources and trade-offs.'],
  },
  pr: {
    name: 'PR & Policy',
    purpose: 'Consider the communication risks before you take a position.',
    brief: 'Review a price-war narrative for Vanguard Cloud’s B200 launch and recommend a response.',
    deliverable: 'A communication recommendation',
    steps: ['Isolate the claim and its supporting evidence.', 'Identify language or assumptions that need review.', 'Return a recommendation and a separate review flag when one applies.'],
  },
  social: {
    name: 'Social Community',
    purpose: 'Turn supplied audience context into a community-content direction.',
    brief: 'Recommend developer-facing community content for Vanguard Cloud’s B200 launch.',
    deliverable: 'A community-content recommendation',
    steps: ['Read the supplied community context.', 'Identify the developer question the content should answer.', 'Recommend a content angle and a way to explain it.'],
  },
  product_marketing: {
    name: 'Product Marketing',
    purpose: 'Build product messaging around the evidence you have.',
    brief: 'Recommend B200 launch messaging using the available hardware and pricing context.',
    deliverable: 'A product-messaging recommendation',
    steps: ['Read the launch brief and comparable product facts.', 'Connect supported differences to the customer problem.', 'Return a message with its assumptions and evidence.'],
  },
  events: {
    name: 'Field Events',
    purpose: 'Give your next field event a useful theme and audience focus.',
    brief: 'Suggest a launch-event theme for ML engineers using the available context.',
    deliverable: 'An event recommendation',
    steps: ['Read the audience, event goals and supplied constraints.', 'Evaluate formats or themes against publicly available context.', 'Recommend a format and audience focus with its trade-offs.'],
  },
};
