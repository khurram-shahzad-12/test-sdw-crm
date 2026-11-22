import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Box, Grid, Typography, Tab, Button, Stack, Paper, LinearProgress, Select, MenuItem, FormControl, InputLabel, } from '@mui/material';
import { TabList, TabContext, TabPanel } from '@mui/lab';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import CurrencyPoundIcon from '@mui/icons-material/CurrencyPound';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import axiosDefault from '../../components/axiosDefault/axiosDefault';
import displaySnackState from '../../components/customisedSnackBar/DisplaySnackState';
import CustomisedSnackBar from '../../components/customisedSnackBar/CustomisedSnackBar';
import StatCard from '../../components/dailyorderreport/StatCard';
import VatBoxTable from '../../components/VatReturn/VatBoxTable';
import { useTheme } from '@mui/material/styles';

const getPalette = (mode) => mode === 'dark' ? {
  pageBg: '#1e1f24',
  cardBg: '#2a2c33',
  cardBgAlt: '#24262c',
  border: '#3a3d45',
  borderLight: '#4a4d55',
  textPrimary: '#e8eaed',
  textSecondary: '#9aa0a6',
  textMuted: '#6b7280',
  accentBlue: '#4a9eff',
  accentGreen: '#4ade80',
  accentRed: '#f87171',
  accentYellow: '#fbbf24',
  accentPurple: '#a78bfa',
  hover: 'rgba(255,255,255,0.04)',
  selected: 'rgba(74,158,255,0.12)',
  payableGrad: 'linear-gradient(135deg, #3a1f1f 0%, #2a1818 100%)',
  reclaimGrad: 'linear-gradient(135deg, #1a2e1f 0%, #152018 100%)',
} : {
  pageBg: '#f5f6f8',
  cardBg: '#ffffff',
  cardBgAlt: '#f0f1f4',
  border: '#e0e2e7',
  borderLight: '#c8ccd4',
  textPrimary: '#1a1c20',
  textSecondary: '#5c6370',
  textMuted: '#8b929e',
  accentBlue: '#1976d2',
  accentGreen: '#2e7d32',
  accentRed: '#c62828',
  accentYellow: '#b26a00',
  accentPurple: '#7b1fa2',
  hover: 'rgba(0,0,0,0.03)',
  selected: 'rgba(25,118,210,0.08)',
  payableGrad: 'linear-gradient(135deg, #ffebee 0%, #fdecea 100%)',
  reclaimGrad: 'linear-gradient(135deg, #e8f5e9 0%, #eaf6ec 100%)',
};

const money = (n) => `£${(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2, })}`;

const buildQuartersForYear = (taxYearStart) => [
  { value: `${taxYearStart}-Q1`, label: `Q1 ${taxYearStart}/${(taxYearStart + 1).toString().slice(-2)}`, sub: 'Apr – Jun' },
  { value: `${taxYearStart}-Q2`, label: `Q2 ${taxYearStart}/${(taxYearStart + 1).toString().slice(-2)}`, sub: 'Jul – Sep' },
  { value: `${taxYearStart}-Q3`, label: `Q3 ${taxYearStart}/${(taxYearStart + 1).toString().slice(-2)}`, sub: 'Oct – Dec' },
  { value: `${taxYearStart + 1}-Q4`, label: `Q4 ${taxYearStart}/${(taxYearStart + 1).toString().slice(-2)}`, sub: 'Jan – Mar' },
];

const VatReturn = () => {
  const theme = useTheme();
  const axios = axiosDefault();
  const currentYear = new Date().getFullYear();
  const DARK = useMemo(() => getPalette(theme.palette.mode), [theme.palette.mode]);

  const [taxYearStart, setTaxYearStart] = useState(currentYear - 1);
  const [availableYears, setAvailableYears] = useState([]);
  const [quarters, setQuarters] = useState(() => buildQuartersForYear(currentYear - 1));
  const [tabValue, setTabValue] = useState(`${currentYear - 1}-Q1`);
  const [selectedQuarter, setSelectedQuarter] = useState(buildQuartersForYear(currentYear - 1)[0]);
  const [loading, setLoading] = useState(false);
  const [snackState, setSnackState] = useState('');
  const [vatData, setVatData] = useState({});
  const isFetchingYears = useRef(false);
  const isFetchingQuarters = useRef(false);
  const hasLoadedYears = useRef(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    const q = quarters.find((x) => x.value === newValue);
    if (q) setSelectedQuarter(q);
  };

  const fetchAvailableYears = useCallback(async () => {
    if (isFetchingYears.current) return;
    isFetchingYears.current = true;
    try {
      const res = await axios.get(`${process.env.REACT_APP_URL_ROOT}/api/vatreturn/available-years`);
      const years = Array.isArray(res.data) ? res.data : [];
      setAvailableYears(years);
      if (years.length > 0 && !hasLoadedYears.current) {
        hasLoadedYears.current = true;
        const latest = years[years.length - 1];
        if (latest !== taxYearStart) {
          setTaxYearStart(latest);
          const newQuarters = buildQuartersForYear(latest);
          setQuarters(newQuarters);
          setTabValue(newQuarters[0].value);
          setSelectedQuarter(newQuarters[0]);
        }
      }
    } catch (error) {
      console.warn('Failed to load available years:', error.message);
    } finally { isFetchingYears.current = false; }
  }, [axios, taxYearStart]);

  const fetchVATReturns = useCallback(async () => {
    if (!taxYearStart) return;
    if (isFetchingQuarters.current) return;
    isFetchingQuarters.current = true;
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_URL_ROOT}/api/vatreturn/quarters`, { params: { taxYearStart } });
      const raw = Array.isArray(res.data) ? res.data : [];
      const map = {};
      raw.forEach((q) => { map[q.quarterKey] = q; });
      setVatData(map);
      displaySnackState('VAT Return loaded successfully', 'success', setSnackState);
    } catch (error) {
      displaySnackState(`Failed to load VAT Return - ${error.response?.data?.message || error.message}`, 'error', setSnackState);
    } finally {
      setLoading(false);
      isFetchingQuarters.current = false;
    }
  }, [axios, taxYearStart]);

  useEffect(() => {
  isFetchingYears.current = false;
  fetchAvailableYears();
}, []);

useEffect(() => {
  isFetchingQuarters.current = false;
  fetchVATReturns();
}, [taxYearStart]);;

  const handleYearChange = (e) => {
    const year = e.target.value;
    if (year === taxYearStart) return;
    setTaxYearStart(year);
    const newQuarters = buildQuartersForYear(year);
    setQuarters(newQuarters);
    setTabValue(newQuarters[0].value);
    setSelectedQuarter(newQuarters[0]);
  };

  const current = useMemo(
    () => vatData[selectedQuarter.value] || {
      period: '—',
      box1: 0, box2: 0, box3: 0, box4: 0, box5: 0,
      box6: 0, box7: 0, box8: 0, box9: 0,
      status: 'Pending',
      dueDate: '—',
    },
    [vatData, selectedQuarter]
  );

  const stats = useMemo(() => ({
    totalDue: current.box3,
    reclaimed: current.box4,
    payable: current.box5,
    sales: current.box6,
    purchases: current.box7,
    status: current.status,
  }), [current]);
  const isPayable = current.box5 >= 0;

  const yearOptions = useMemo(() => (availableYears.length > 0 ? availableYears : [currentYear - 1, currentYear]),
    [availableYears, currentYear]
  );
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
      <Box
        sx={{ p: { xs: 2, md: 3 }, minHeight: '100vh', backgroundColor: DARK.pageBg, color: DARK.textPrimary, }}
      >
        {loading && (
          <LinearProgress
            sx={{
              mb: 2, borderRadius: 1,
              backgroundColor: DARK.border,
              '& .MuiLinearProgress-bar': { backgroundColor: DARK.accentBlue },
            }}
          />
        )}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  p: 1.2, borderRadius: 2,
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #2a5298 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${DARK.borderLight}`,
                }}
              >
                <AccountBalanceIcon sx={{ color: DARK.accentBlue, fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2, color: DARK.textPrimary }}> VAT Return </Typography>
                <Typography variant="body2" sx={{ color: DARK.textSecondary }}> Quarterly Report · {current.period} </Typography>
              </Box>
            </Stack>
          </Grid>
          <Grid
            item xs={12} md={5}
            sx={{ borderBottom: `1px solid ${DARK.border}`, display: 'flex', justifyContent: 'center' }}
          >
            <TabContext value={tabValue}>
              <TabList
                onChange={handleTabChange}
                variant="scrollable"
                aria-label="vat quarter tabs"
                sx={{
                  '& .MuiTab-root': { color: DARK.textSecondary, minHeight: 56 },
                  '& .Mui-selected': { color: DARK.accentBlue },
                  '& .MuiTabs-indicator': { backgroundColor: DARK.accentBlue },
                }}
              >
                {quarters.map((q) => (
                  <Tab
                    key={q.value}
                    value={q.value}
                    label={
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.1 }}> {q.label} </Typography>
                        <Typography variant="caption" sx={{ color: 'inherit', opacity: 0.7 }}> {q.sub} </Typography>
                      </Box>
                    }
                  />
                ))}
              </TabList>
            </TabContext>
          </Grid>
          <Grid item xs={6} md={1.4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: DARK.textSecondary }}>Tax Year</InputLabel>
              <Select
                value={taxYearStart}
                label="Tax Year"
                onChange={handleYearChange}
                sx={{
                  color: DARK.textPrimary,
                  height: 56,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: DARK.border },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: DARK.accentBlue },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: DARK.accentBlue },
                  '& .MuiSvgIcon-root': { color: DARK.textSecondary },
                }}
              >
                {yearOptions.map((year) => (<MenuItem key={year} value={year}> {year}/{(year + 1).toString().slice(-2)} </MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={1.5}>
            <Button
              variant="contained"
              onClick={fetchVATReturns}
              fullWidth
              sx={{
                height: 56, backgroundColor: DARK.accentBlue, color: '#fff',
                '&:hover': { backgroundColor: '#3a8eef' },
              }}
            > Reload </Button>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2.4}>
            <StatCard label="VAT Due (Box 3)" value={money(stats.totalDue)} color={DARK.accentBlue} icon={<ReceiptLongIcon fontSize="small" />} />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <StatCard label="VAT Reclaimed (Box 4)" value={money(stats.reclaimed)} color={DARK.accentGreen} icon={<CurrencyPoundIcon fontSize="small" />} />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <StatCard
              label={isPayable ? 'VAT Payable (Box 5)' : 'VAT Reclaimable (Box 5)'}
              value={money(Math.abs(stats.payable))}
              color={isPayable ? DARK.accentRed : DARK.accentGreen}
              icon={<CurrencyPoundIcon fontSize="small" />}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <StatCard label="Sales (Box 6)" value={money(stats.sales)} color={DARK.textSecondary} icon={<StorefrontIcon fontSize="small" />} />
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <StatCard label="Purchases (Box 7)" value={money(stats.purchases)} color={DARK.textSecondary} icon={<ShoppingCartIcon fontSize="small" />} />
          </Grid>
        </Grid>
        <TabContext value={tabValue}>
          {quarters.map((q) => {
            const d = vatData[q.value] || {
              period: '—', box1: 0, box2: 0, box3: 0, box4: 0, box5: 0,
              box6: 0, box7: 0, box8: 0, box9: 0, dueDate: '—',
            };
            const payable = d.box5 >= 0;
            return (
              <TabPanel key={q.value} value={q.value} sx={{ px: 0 }}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5, mb: 3, borderRadius: 2,
                    background: payable ? DARK.payableGrad : DARK.reclaimGrad,
                    borderColor: payable ? `${DARK.accentRed}40` : `${DARK.accentGreen}40`,
                  }}
                >
                  <Grid container alignItems="center" spacing={2}>
                    <Grid item xs={12} md={7}>
                      <Typography variant="overline" sx={{ letterSpacing: 1, color: DARK.textMuted }}>
                        VAT Period
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: DARK.textPrimary }}>
                        {d.period}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                        <InfoOutlinedIcon sx={{ fontSize: 14, color: DARK.textMuted }} />
                        <Typography variant="caption" sx={{ color: DARK.textSecondary }}>
                          Payment due date: <strong style={{ color: DARK.textPrimary }}>{d.dueDate}</strong>
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                      <Typography variant="overline" sx={{ letterSpacing: 1, color: DARK.textMuted }}>
                        {payable ? 'Amount Payable to HMRC' : 'Amount Reclaimable from HMRC'}
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 800,
                          color: payable ? DARK.accentRed : DARK.accentGreen,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {money(Math.abs(d.box5))}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
                <VatBoxTable DARK={DARK} d={d} />
              </TabPanel>
            );
          })}
        </TabContext>
      </Box>
    </LocalizationProvider>
  );
};

export default VatReturn;