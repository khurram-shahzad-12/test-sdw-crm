import { useState } from 'react';
import { Box, Chip, Collapse, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography, } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import moment from 'moment';
import { fmt, isCreditMode } from './KpiCard';

const InvoiceRow = ({ row, windowScoped = false }) => {
  const [open, setOpen] = useState(false);
  const pays = row.payments || [];
  const credits = row.creditNotes || [];
  const totalPayments = pays.length;

  const cashPaid = pays.reduce( (s, p) => (p.isCredit || isCreditMode(p.mode) ? s : s + (Number(p.amount) || 0)), 0 );
 const creditAmount = pays.reduce(
    (s, p) => (p.isCredit || isCreditMode(p.mode) ? s + (Number(p.amount) || 0) : s),
    0
  );
  const statusColor =
    row.status === 'PAID'           ? 'success' :
    row.status === 'PARTIALLY_PAID' ? 'info'    :
    row.status === 'PENDING'        ? 'warning' :
    row.status === 'OVER_PAID'      ? 'secondary' :
    row.status === 'CANCELLED'      ? 'default' :
    row.status === 'RETURNED'       ? 'error'   : 'default';

  return (
    <>
      <TableRow hover>
        <TableCell width={48}>
          <IconButton size="small" onClick={() => setOpen(!open)} disabled={totalPayments === 0}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{row.saleNumber || '—'}</TableCell>
        <TableCell sx={{ fontWeight: 500 }}>{row.customerName || '—'}</TableCell>
        <TableCell>{row.invoiceDate ? moment(row.invoiceDate).format('DD MMM YY') : '—'}</TableCell>
        <TableCell>
          <Chip size="small" label={row.status || '—'} color={statusColor} variant="outlined" />
        </TableCell>
        <TableCell align="right">{fmt(row.totalInclVat)}</TableCell>
        <TableCell align="right">{fmt(cashPaid)}</TableCell>
        <TableCell align="right">{fmt(creditAmount)}</TableCell>
        <TableCell align="right">{fmt(row.balanceDue)}</TableCell>
        <TableCell align="center">{totalPayments}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={10} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1.5, pl: 6 }}>
              {pays.length > 0 ? (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Payments
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {pays.map((p) => (
                      <Chip
                        key={p._id}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ justifyContent: 'flex-start', maxWidth: 'fit-content' }}
                        label={`${p.mode} · ${fmt(p.amount)} · ${moment(p.date).format('DD MMM YY, hh:mm A')}${p.recordedBy ? ' · ' + p.recordedBy : ''}${p.comments ? ' · ' + p.comments : ''}`}
                      />
                    ))}
                  </Stack>
                </>
              ) : (
                <Typography variant="caption" color="text.secondary"> No payments recorded. </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};
const InvoiceTable = ({ rows, windowScoped = false }) => {
  if (!rows.length) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">No invoices to display.</Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell width={48} />
            <TableCell>Sale #</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Invoice Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Invoice Total</TableCell>
            <TableCell align="right">Paid</TableCell>
            <TableCell align="right">Credit</TableCell>
            <TableCell align="right">Balance</TableCell>
            <TableCell align="center">Payments</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <InvoiceRow key={row.invoiceId} row={row} windowScoped={windowScoped} />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default InvoiceTable;