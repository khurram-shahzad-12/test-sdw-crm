import { useState, useEffect, useCallback } from 'react';
import { Alert, Box, Button, Container, Paper, Tab, Tabs, TextField, Typography, } from '@mui/material';
import moment from 'moment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PaymentsIcon from '@mui/icons-material/Payments';
import TodayIcon from '@mui/icons-material/Today';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import axiosDefault from '../../components/axiosDefault/axiosDefault';
import OverviewTab from '../../components/AccountsReport/OverViewTab';
import PaymentsTab from '../../components/AccountsReport/PaymentsTab';
import DriverAccountsTab from '../../components/AccountsReport/DriverAccountsTab';

const AccountsReport = () => {
  const axios = axiosDefault();
  const [tab, setTab] = useState(0);
  const [refDate, setRefDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccountReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dateStr = moment(refDate).format('YYYY-MM-DD');
      const res = await axios.get( `${process.env.REACT_APP_URL_ROOT}/api/accountsReport`, { params: { date: dateStr } } );
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
      setData(null);
    } finally { setLoading(false); }
  }, [refDate]);
  useEffect(() => { fetchAccountReport(); }, [fetchAccountReport]);

  const d = data || {
    rangeLabel: '—',
    invoiceDay: {
      totalInvoices: 0, paidInvoices: 0, pendingInvoices: 0, partiallyPaid: 0,
      overPaidInvoices: 0, cancelledInvoices: 0, returnedInvoices: 0,
      totalInvoiced: 0, totalCashPaidOnTheseInvoices: 0,
      totalCreditOnTheseInvoices: 0, outstandingOnTheseInvoices: 0,
      expectedCollection: 0, expectedOutstanding: 0,
    },
    collectionPeriod: {
      totalCollected: 0, creditAppliedInWindow: 0, totalCollectedIncludingCredit: 0,
      totalInvoices: 0, paidInvoices: 0, pendingInvoices: 0,
      partiallyPaid: 0, overPaidInvoices: 0,
      byMode: [], hourly: [], payments: [], creditPayments: [],
    },
    paymentsTab: { invoicesIssuedDay: [], invoicesPaidInWindow: [] },
  };
  const dayRows = d.paymentsTab.invoicesIssuedDay || [];
  const windowRows = d.paymentsTab.invoicesPaidInWindow || [];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Container maxWidth="xl" sx={{ mb: 4 }}>
        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Overview" icon={<AssessmentIcon />} iconPosition="start" />
            <Tab label="Payments" icon={<PaymentsIcon />} iconPosition="start" />
            <Tab label="Driver Accounts" icon={<LocalShippingIcon />} iconPosition="start" />
          </Tabs>
        </Paper>
        <Box sx={{ display: { xs: 'block', lg: 'flex' }, justifyContent: 'space-between', alignItems: 'flex-start', mt: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ mt: 2, color: 'greenyellow', borderBottom: 2, display: 'inline-block', mb: 2 }}>
              {tab === 0 ? 'Accounts Report — Overview'
                : tab === 1 ? 'Accounts Report — Payments'
                : 'Accounts Report — Driver Accounts'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: { xs: 2, lg: 2 } }}>
            <TextField
              label="Business day"
              type="date"
              size="small"
              value={moment(refDate).format('YYYY-MM-DD')}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setRefDate(moment(v, 'YYYY-MM-DD').toDate());
              }}
              InputLabelProps={{ shrink: true }}
              sx={(theme) => {
                const isDark = theme.palette.mode === 'dark';
                const iconFilter = isDark ? 'invert(1) brightness(1.4)' : 'none';
                return {
                  width: 220,
                  '& input[type="date"]': { paddingRight: '6px', cursor: 'pointer' },
                  '& input[type="date"]::-webkit-calendar-picker-indicator': {
                    cursor: 'pointer', opacity: 1, display: 'block', filter: iconFilter,
                  },
                  '& input[type="date"]::-moz-calendar-picker-indicator': {
                    cursor: 'pointer', filter: iconFilter,
                  },
                };
              }}
            />
            <Button variant="contained" sx={{ ml: 2 }} onClick={fetchAccountReport} disabled={loading} startIcon={<TodayIcon />}>
              {loading ? 'Loading…' : 'Reload'}
            </Button>
          </Box>
        </Box>
        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
        <Box sx={{ py: 1 }}>
          {tab === 0 && <OverviewTab refDate={refDate} d={d} />}
          {tab === 1 && <PaymentsTab refDate={refDate} d={d} dayRows={dayRows} windowRows={windowRows} />}
          {tab === 2 && <DriverAccountsTab refDate={refDate} />}
        </Box>
      </Container>
    </Box>
  );
};

export default AccountsReport;