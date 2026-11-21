// Editorial role summaries; public examples are explicitly illustrative views.
export const AGENT_COPY = {
  branding: {
    name: 'Branding',
    purpose: 'Find a clear position for your next launch.',
    brief: 'Position a fictional device-repair and trade-in service.',
    deliverable: 'A positioning recommendation',
    steps: ['Read the audience and launch context.', 'Compare plausible positioning angles against the available evidence.', 'Return a positioning statement with the sources and trade-offs.'],
  },
  pr: {
    name: 'PR & Policy',
    purpose: 'Consider the communication risks before you take a position.',
    brief: 'Review an environmental claim for a fictional repair and trade-in service.',
    deliverable: 'A communication recommendation',
    steps: ['Isolate the claim and its supporting evidence.', 'Identify language or assumptions that need review.', 'Return a recommendation and a separate review flag when one applies.'],
  },
  social: {
    name: 'Social Community',
    purpose: 'Turn supplied audience context into a community-content direction.',
    brief: 'Plan a practical device-preparation community post.',
    deliverable: 'A community-content recommendation',
    steps: ['Read the supplied community context.', 'Identify the customer question the content should answer.', 'Recommend a content angle and a way to explain it.'],
  },
  product_marketing: {
    name: 'Product Marketing',
    purpose: 'Build product messaging around the evidence you have.',
    brief: 'Explain repair and trade-in options using confirmed service terms.',
    deliverable: 'A product-messaging recommendation',
    steps: ['Read the service brief and relevant source guidance.', 'Connect supported differences to the customer problem.', 'Return a message with its assumptions and evidence.'],
  },
  events: {
    name: 'Field Events',
    purpose: 'Give your next field event a useful theme and audience focus.',
    brief: 'Outline a useful local device-care information event.',
    deliverable: 'An event recommendation',
    steps: ['Read the audience, event goals and supplied constraints.', 'Evaluate formats or themes against publicly available context.', 'Recommend a format and audience focus with its trade-offs.'],
  },
};
