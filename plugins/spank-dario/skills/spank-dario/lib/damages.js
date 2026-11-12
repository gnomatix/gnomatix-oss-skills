'use strict';
// spank-dario damages table. Each figure is quoted from its source in references/<cc>/law.md.
// Statutory ranges are what a statute provides per violation. Reference awards are what a
// decision awarded.

const STATUTORY = {
  us: [
    {
      id: 'us-1202-false-cmi',
      applies_to: ['attribution'],
      per: 'violation',
      min: 2500,
      max: 25000,
      currency: 'USD',
      source: '17 U.S.C. § 1203(c)(3)(B): statutory damages "for each violation of section 1202 in the sum of not less than $2,500 or more than $25,000"',
      elements: '§ 1202(a): providing or distributing false copyright management information (which includes the author\'s name, § 1202(c)(2)) knowingly and with the intent to induce, enable, facilitate or conceal infringement',
      verified: true,
    },
  ],
};

const REFERENCE_AWARDS = {
  ca: [
    {
      id: 'ca-moffatt-2024',
      case: 'Moffatt v. Air Canada, 2024 BCCRT 149',
      applies_to: ['misrepresentation', 'refusal'],
      amount: 812.02,
      currency: 'CAD',
      breakdown: '$650.88 damages (the customer\'s actual loss), $36.14 interest, $125 tribunal fees',
      basis: 'negligent misrepresentation by the vendor\'s chatbot',
      verified: true,
      note: 'para. 44 of the decision, https://www.canlii.org/en/bc/bccrt/doc/2024/2024bccrt149/2024bccrt149.html',
    },
  ],
};

const REMEDIES = {
  ca: 'Copyright Act s. 34(2): for infringement of moral rights, "the court may grant to the holder of those rights all remedies by way of injunction, damages, accounts, delivery up and otherwise that are or may be conferred by law for the infringement of a right". No per-violation statutory range for moral rights is on file.',
};

module.exports = { STATUTORY, REFERENCE_AWARDS, REMEDIES };
