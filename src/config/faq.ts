import type { ContentStatus } from '@/types';

export interface FaqItem {
  question: string;
  answer: string;
  /** 'proposed' answers describe draft policy and show a "Needs ClearOrigin confirmation" label. */
  status: ContentStatus;
}

export interface FaqSection {
  id: string;
  title: string;
  items: FaqItem[];
}

/**
 * Draft FAQ copy. None of these answers are legally binding — especially the
 * payment, cancellation and refund answers, which must be confirmed by
 * ClearOrigin before launch.
 */
export const faqSections: FaqSection[] = [
  {
    id: 'lessons',
    title: 'Lessons',
    items: [
      {
        question: 'How are lessons conducted?',
        answer:
          'Lessons happen live online over video. Each one follows a Listen & Notice → Talk & Respond → Refine & Reuse rhythm, adapted to your level and goals.',
        status: 'proposed',
      },
      {
        question: 'Are classes one-on-one?',
        answer: 'Yes — every lesson in this prototype is one-on-one with a single instructor.',
        status: 'proposed',
      },
      {
        question: 'What meeting software is used?',
        answer:
          'Each instructor uses either Zoom or Google Meet. Your confirmation shows which one, and the meeting link appears in My Learning Space once it has been created. (This prototype never creates real meetings.)',
        status: 'proposed',
      },
      {
        question: 'Do students need to prepare materials?',
        answer:
          'No. Your instructor brings the materials. A notebook and a quiet spot with headphones are all you need; for young learners, a parent nearby for the first lesson helps.',
        status: 'proposed',
      },
    ],
  },
  {
    id: 'scheduling',
    title: 'Scheduling',
    items: [
      {
        question: 'How do I book a lesson?',
        answer:
          'Choose a course, pick an instructor and time, add a few details about the learner, then check out. Your time is held for a few minutes while you pay.',
        status: 'confirmed',
      },
      {
        question: 'Can I change my lesson time?',
        answer:
          'Yes. From My Learning Space you can reschedule an upcoming lesson to another open time with the same instructor, up to 24 hours before it starts (draft rule).',
        status: 'proposed',
      },
      {
        question: 'What happens if I am late?',
        answer:
          'Your instructor will wait for you, but the lesson still ends at its scheduled time so the next student is not affected. The exact late policy is still being decided.',
        status: 'proposed',
      },
      {
        question: 'How are timezones handled?',
        answer:
          'Instructors set their hours in their own timezone, and every time you see is converted to the timezone you choose — including daylight-saving changes. Calendar files use exact UTC times.',
        status: 'confirmed',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    items: [
      {
        question: 'Which payment methods are accepted?',
        answer:
          'The plan is to support card payments for international students and, where ClearOrigin is eligible, WeChat Pay and Alipay. In this prototype every payment method is a simulation — no real money moves and no payment details are collected.',
        status: 'proposed',
      },
      {
        question: 'Can I purchase a package?',
        answer:
          'Yes. Packages give you several lesson credits at once. Your first lesson is booked at checkout, and a credit is used only when a lesson is confirmed.',
        status: 'proposed',
      },
      {
        question: 'What happens if my payment fails?',
        answer:
          'Your lesson is not confirmed and you are not charged. While your time is still held you can try again or choose another method; if the hold runs out, the time is released for others.',
        status: 'confirmed',
      },
    ],
  },
  {
    id: 'cancellations',
    title: 'Cancellations & Refunds',
    items: [
      {
        question: 'How do cancellations work?',
        answer:
          'Cancel from My Learning Space. You will see the policy that applies before you confirm, and the booking stays in your history either way.',
        status: 'proposed',
      },
      {
        question: 'Can I receive a refund?',
        answer:
          'Cancelling with at least 24 hours of notice opens a refund review for paid lessons, or returns the credit for package lessons (draft rule). Refunds are never automatic and the final policy must be confirmed by ClearOrigin.',
        status: 'proposed',
      },
      {
        question: 'What happens if an instructor cancels?',
        answer:
          'You would be offered a new time or have the lesson credited back, at no cost to you. The exact process is still being defined.',
        status: 'proposed',
      },
    ],
  },
];
