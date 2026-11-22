import { Paper, Stack, Typography } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import moment from 'moment';
import InvoiceTable from './InvoiceTable';

const PaymentsTab = ({ refDate, d, dayRows, windowRows }) => (
  <>
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <ReceiptLongIcon fontSize="small" color="primary" />
        <Typography variant="subtitle1" fontWeight={600} color={'yellowgreen'}>
          Invoices Issued on {moment(refDate).format('DD MMM YYYY')} — Paid or Credited
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Every invoice issued that day that has received any payment or credit · {dayRows.length} row{dayRows.length === 1 ? '' : 's'}
      </Typography>
      <InvoiceTable rows={dayRows} />
    </Paper>
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <PaymentsIcon fontSize="small" color="success" />
        <Typography variant="subtitle1" fontWeight={600} color={'yellowGreen'}> Invoices Paid or Credited During the Business Window </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {d.rangeLabel} · payments / credits that landed inside the 1:30 PM → 1:30 PM window · {windowRows.length} row{windowRows.length === 1 ? '' : 's'}
      </Typography>
      <InvoiceTable rows={windowRows} windowScoped />
    </Paper>
  </>
);

export default PaymentsTab;