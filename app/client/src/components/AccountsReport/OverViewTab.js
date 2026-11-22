import { Box, Divider, Grid, LinearProgress, Paper, Stack, Typography, } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import MoneyIcon from '@mui/icons-material/Money';
import moment from 'moment';
import KpiCard, { fmt, fmtCount } from './KpiCard';

const ModeBreakdown = ({ rows, total }) => {
  if (!rows?.length) {
    return ( <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}> No payments in this period. </Typography> );
  }
  return (
    <Stack spacing={2}>
      {rows.map((row) => {
        const pct = total > 0 ? (row.amount / total) * 100 : 0;
        return (
          <Box key={row.mode}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="body2" fontWeight={500}>
                {row.mode}{' '}
                <Typography component="span" variant="caption" color="text.secondary">({row.count})</Typography>
              </Typography>
              <Typography variant="body2" fontWeight={600}>{fmt(row.amount)}</Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{ height: 8, borderRadius: 4, bgcolor: 'grey.100' }}
            />
          </Box>
        );
      })}
    </Stack>
  );
};

const OverViewTab = ({ refDate, d }) => (
  <>
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <ReceiptLongIcon fontSize="small" color="primary" />
        <Typography variant="subtitle1" fontWeight={600} color={'greenyellow'}>
          Invoices Issued on {moment(refDate).format('DD MMM YYYY')}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Full calendar day (00:00 → 23:59) · status & money as of now
      </Typography>

      <Grid container spacing={2}>
        {[
          { label: 'Total Invoices', value: fmtCount(d.invoiceDay.totalInvoices),  accent: 'primary',   icon: <ReceiptLongIcon /> },
          { label: 'Paid',           value: fmtCount(d.invoiceDay.paidInvoices),   accent: 'success',   icon: <ReceiptLongIcon /> },
          { label: 'Pending',        value: fmtCount(d.invoiceDay.pendingInvoices),accent: 'warning',   icon: <PendingActionsIcon /> },
          { label: 'Partially Paid', value: fmtCount(d.invoiceDay.partiallyPaid),  accent: 'info',      icon: <PendingActionsIcon /> },
          { label: 'Total Invoiced', value: fmt(d.invoiceDay.totalInvoiced),       accent: 'secondary', icon: <MoneyIcon /> },
          { label: 'Cash Received',  value: fmt(d.invoiceDay.totalCashPaidOnTheseInvoices), accent: 'success', icon: <PaymentsIcon /> },
          { label: 'Credit Given',   value: fmt(d.invoiceDay.totalCreditOnTheseInvoices),   accent: 'info',    icon: <CreditScoreIcon /> },
          { label: 'Outstanding',    value: fmt(d.invoiceDay.outstandingOnTheseInvoices),   accent: 'error',   icon: <AccountBalanceWalletIcon /> },
        ].map((it) => (
          <Grid item xs={6} sm={4} md={3} key={it.label}>
            <KpiCard {...it} />
          </Grid>
        ))}
      </Grid>
      <Divider sx={{ my: 2 }} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Expected collection from these invoices</Typography>
          <Typography variant="h6" fontWeight={700}>{fmt(d.invoiceDay.expectedCollection)}</Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">Still outstanding from these invoices</Typography>
          <Typography variant="h6" fontWeight={700} color="error.main">{fmt(d.invoiceDay.expectedOutstanding)}</Typography>
        </Box>
      </Stack>
    </Paper>
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <PaymentsIcon fontSize="small" color="success" />
        <Typography variant="subtitle1" fontWeight={600} color={'yellowgreen'}>Collections in Business Day</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {d.rangeLabel} · cash received in the 1:30 PM → 1:30 PM window (credit notes excluded)
      </Typography>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Invoices with Payments in Window</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Invoices in Window', value: fmtCount(d.collectionPeriod.totalInvoices ?? 0),   accent: 'primary', icon: <ReceiptLongIcon /> },
          { label: 'Paid',               value: fmtCount(d.collectionPeriod.paidInvoices ?? 0),    accent: 'success', icon: <ReceiptLongIcon /> },
          { label: 'Partially Paid',     value: fmtCount(d.collectionPeriod.partiallyPaid ?? 0),   accent: 'info',    icon: <PendingActionsIcon /> },
          { label: 'Pending',            value: fmtCount(d.collectionPeriod.pendingInvoices ?? 0), accent: 'warning', icon: <PendingActionsIcon /> },
        ].map((it) => (
          <Grid item xs={6} sm={6} md={3} key={it.label}><KpiCard {...it} /></Grid>
        ))}
      </Grid>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Money</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Collected', value: fmt(d.collectionPeriod.totalCollected),                accent: 'success',   icon: <PaymentsIcon /> },
          { label: 'Credit Notes',    value: fmt(d.collectionPeriod.creditAppliedInWindow),         accent: 'info',      icon: <CreditScoreIcon /> },
          { label: 'Incl. Credit',    value: fmt(d.collectionPeriod.totalCollectedIncludingCredit), accent: 'secondary', icon: <MoneyIcon /> },
        ].map((it) => (
          <Grid item xs={12} sm={6} md={4} key={it.label}><KpiCard {...it} /></Grid>
        ))}
      </Grid>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Breakdown by Payment Mode</Typography>
      <ModeBreakdown rows={d.collectionPeriod.byMode} total={d.collectionPeriod.totalCollected} />
    </Paper>
  </>
);

export default OverViewTab;
