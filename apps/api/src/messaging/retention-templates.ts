/**
 * Server-side reference: WhatsApp retention templates (master prompt).
 * Wire to Bull/cron when automation is enabled.
 */
export const RETENTION_TRIGGERS = [
  {
    id: 'revisit_reminder',
    delay: '30d',
    template:
      "Hi {name}! It's been a while 😊 Ready for your next {service}? Book here: {link}",
  },
  {
    id: 'birthday_message',
    delay: '0d',
    template:
      'Happy Birthday {name}! 🎂 Enjoy 20% off your next visit. Book: {link}',
  },
  {
    id: 'post_visit_followup',
    delay: '1d',
    template:
      'Hope you loved your {service} yesterday! ⭐ How was your experience with us?',
  },
  {
    id: 'inactive_recovery',
    delay: '45d',
    template:
      "We’d love to see you again at {businessName}! Book in one tap: {link}",
  },
] as const;
