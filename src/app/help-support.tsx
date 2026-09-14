import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Page, Panel, Row } from '@/components/ui/ledger-ui';
const FAQ = [
  [
    'How do I add an expense?',
    'Create a group, add names, then choose Add expense. Enter the amount and description, check who paid and who shared it, then save. You can exclude people or change the split.',
  ],
  [
    'Does Splitly send money?',
    'No. Make the payment outside Splitly, then record it against the correct person and group. A recorded payment is not confirmation from a bank. Partial payments reduce the remaining balance.',
  ],
  [
    'Why do I owe money when my net is zero?',
    'Money owed to one person does not cancel money another person owes you. Each pair of people and each group keeps its own balance.',
  ],
  [
    'How do I correct a mistake?',
    'Open an expense to edit or delete it. Deleted expenses can be restored from Activity. Open a recorded payment to undo it. Edits and corrections update balances and appear in Activity.',
  ],
  [
    'Where is my data saved?',
    'Your groups and expenses are saved to your account online and shared with joined group members. Sign in on another device to access them. Unsaved expense drafts stay on the device where you started them.',
  ],
  [
    'How do invitations work?',
    'In an account group, its creator can invite a person from the People tab. The code expires in seven days and can be used once, by a signed-in recipient. Preview the group and your participant name before joining.',
  ],
  [
    'Can I change currencies?',
    'Choose a default currency in Preferences for future groups. Existing groups keep their original currency. Splitly does not convert currencies or add balances in different currencies together.',
  ],
  [
    'Can I scan a receipt?',
    'You can attach a small photo for reference. Enter the amount yourself; automatic receipt extraction is not available.',
  ],
];
export default function Help() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Page title="Help">
      {FAQ.map(([q, a], i) => (
        <Panel key={q}>
          <Row
            title={q}
            icon={open === i ? 'remove' : 'add'}
            onPress={() => setOpen(open === i ? null : i)}
          />
          {open === i && <Copy>{a}</Copy>}
        </Panel>
      ))}
      <Copy>
        For a failed save, keep the form open, check your connection and retry. Refresh a group if
        it changed on another device.
      </Copy>
      <Copy muted>
        Support contact details and legal policies have not been configured for this build. A public
        release needs those details from the product owner.
      </Copy>
      <Button title="Close answers" variant="ghost" onPress={() => setOpen(null)} />
    </Page>
  );
}
