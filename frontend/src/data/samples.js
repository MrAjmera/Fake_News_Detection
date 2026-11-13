// Sample articles copied in at build time — the frontend never reads the filesystem.
// The satire sample was written for this demo; its behaviour was checked against the live model.

export const SAMPLES = [
  {
    id: 'fake',
    label: 'Fake sample',
    kind: 'fake',
    text:
      'BREAKING: Scientists discover chocolate cures all diseases! Pharmaceutical ' +
      "companies hate this one weird trick. Doctors are shocked by this miracle cure " +
      "that Big Pharma doesn't want you to know about. Share this before it gets deleted!",
  },
  {
    id: 'real',
    label: 'Real sample',
    kind: 'real',
    text:
      'WASHINGTON (Reuters) - The U.S. Commerce Department said on Tuesday that it ' +
      'would extend the deadline for public comment on proposed tariff changes ' +
      'affecting imported steel products. The agency said in a statement that the ' +
      'extension was granted after several industry groups requested additional time ' +
      'to prepare submissions. Officials said the review is part of a routine process ' +
      'and no final decision has been made. A spokesman declined to comment on when ' +
      'the department would issue its findings. Shares of major steel producers were ' +
      'little changed in afternoon trading.',
  },
  {
    id: 'satire',
    label: 'Satire sample',
    kind: 'satire',
    note:
      'This is an invented satirical piece. The model has no concept of satire, so it ' +
      'judges only the writing style. In testing it read as FAKE across several small ' +
      'rewordings, which is the same label it gives to deliberate misinformation.',
    text:
      'LOCAL MAN SHOCKED TO DISCOVER HE HAS BEEN DOING LAUNDRY WRONG FOR 40 YEARS. ' +
      'Area resident Gary Plimpton, 52, reportedly stood motionless in his basement on ' +
      'Tuesday after a neighbor casually mentioned that socks do not, in fact, need to ' +
      'be sorted by mood. "I have always believed the dryer was judging me," said ' +
      'Plimpton, clutching a lint trap. Experts at the Institute for Unnecessary ' +
      'Studies confirmed that nine out of ten dryers are mostly indifferent. At press ' +
      'time, Plimpton was reportedly rethinking his entire relationship with fabric ' +
      'softener and had asked his family to respect his privacy.',
  },
  {
    id: 'limitation',
    label: 'Known limitation',
    kind: 'limitation',
    note:
      'This is a genuine Reserve Bank of India report, but the model calls it FAKE. ' +
      'The training corpora (ISOT, WELFake, CoAID) are US/Reuters-centric, so ' +
      'non-Western financial reporting falls outside the learned distribution — the ' +
      'token "india" alone carries a positive (fake-leaning) coefficient.',
    text:
      'The Reserve Bank of India announced today that interest rates will remain ' +
      'unchanged at 6.5 percent. The decision was made after reviewing current ' +
      'economic indicators including inflation rates and GDP growth. Financial ' +
      'analysts had predicted this outcome based on recent market trends.',
  },
]
