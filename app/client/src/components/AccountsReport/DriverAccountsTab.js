import { useState, useEffect, useCallback } from 'react';
import { Alert, Grid, Paper, Stack, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import moment from 'moment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MoneyIcon from '@mui/icons-material/Money';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import axiosDefault from '../../components/axiosDefault/axiosDefault'
import KpiCard, { fmt, fmtCount } from './KpiCard';

const DriverAccountsTab = ({ refDate }) => {
  const axios = axiosDefault();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDriversTotal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = moment(refDate).format('YYYY-MM-DD');
      const res = await axios.get( `${process.env.REACT_APP_URL_ROOT}/api/accountsReport/driverAccountsTotal`, { params: { date: dateStr } } );
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load driver totals');
      setData(null);
    } finally { setLoading(false); }
  }, [refDate]);

  useEffect(() => { fetchDriversTotal(); }, [fetchDriversTotal]);
  const rows = data?.rows || [];
  const totals = data?.totals || { cashTotal: 0, cashReceived: 0, cashDifference: 0, cardTotal: 0, deductionAmount: 0, };
  const driverColumns = [
    { field: 'driverName',  headerName: 'Driver',  width: 180 },
    { field: 'vehicleName', headerName: 'Vehicle', width: 140 },
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      renderCell: (params) => params.value ? moment(params.value).format('DD MMM YY') : '—',
    },
    { field: 'zoneName', headerName: 'Zone', width: 140 },
    { field: 'helper',   headerName: 'Helper', width: 130, renderCell: (params) => params.value || '—' },
    {
      field: 'cardTotal',
      headerName: 'Card Total',
      width: 130, align: 'right', headerAlign: 'right',
      renderCell: (params) => fmt(params.value),
    },
    {
      field: 'cashTotal',
      headerName: 'Cash Total',
      width: 130, align: 'right', headerAlign: 'right',
      renderCell: (params) => fmt(params.value),
    },
    {
      field: 'cashReceived',
      headerName: 'Cash Received',
      width: 140, align: 'right', headerAlign: 'right',
      renderCell: (params) => fmt(params.value),
    },
    {
      field: 'cashDifference',
      headerName: 'Cash Diff',
      width: 130, align: 'right', headerAlign: 'right',
      renderCell: (params) => {
        const n = Number(params.value) || 0;
        const color = n < 0 ? 'error.main' : 'success.main';
        return <Typography variant="body2" sx={{ color, fontWeight: 600 }}>{fmt(n)}</Typography>;
      },
    },
    {
      field: 'deductionAmount',
      headerName: 'Deduction',
      width: 130, align: 'right', headerAlign: 'right',
      renderCell: (params) => fmt(params.value),
    },
    { field: 'reason', headerName: 'Reason', width: 100, renderCell: (params) => params.value || '—' },
    { field: 'notes',  headerName: 'Notes',  flex: 1, minWidth: 160, renderCell: (params) => params.value || '—' },
  ];
  const gridKey = `driver-grid-${rows.length}-${moment(refDate).format('YYYYMMDD')}`;

  return (
    <>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <LocalShippingIcon fontSize="small" color="primary" />
          <Typography variant="subtitle1" fontWeight={600}> Driver Totals on {moment(refDate).format('DD MMM YYYY')} </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Aggregated cash and card totals recorded by drivers on this date
        </Typography>
        <Grid container spacing={2}>
          {[
            { label: 'Drivers',          value: fmtCount(rows.length),               accent: 'primary',   icon: <LocalShippingIcon /> },
            { label: 'Cash Total',       value: fmt(totals.cashTotal),               accent: 'secondary', icon: <MoneyIcon /> },
            { label: 'Cash Received',    value: fmt(totals.cashReceived),            accent: 'success',   icon: <PaymentsIcon /> },
            { label: 'Cash Difference',  value: fmt(totals.cashDifference),          accent: totals.cashDifference < 0 ? 'error' : 'success', icon: <AccountBalanceWalletIcon /> },
            { label: 'Card Total',       value: fmt(totals.cardTotal),               accent: 'info',      icon: <CreditScoreIcon /> },
            { label: 'Deductions',       value: fmt(totals.deductionAmount),         accent: 'warning',   icon: <ReceiptLongIcon /> },
          ].map((it) => (
            <Grid item xs={6} sm={4} md={2} key={it.label}>
              <KpiCard {...it} />
            </Grid>
          ))}
        </Grid>
      </Paper>
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Driver Records · {rows.length} row{rows.length === 1 ? '' : 's'}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <DataGrid
          key={gridKey}
          rows={rows}
          columns={driverColumns}
          getRowId={(row) => row.id}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        />
      </Paper>
    </>
  );
};

export default DriverAccountsTab;