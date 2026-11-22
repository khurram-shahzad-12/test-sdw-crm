import { Box, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import StatCard from "./StatCard";
import BarChart from "./BarChart";
import LineProgress from "./LineProgress";
import CustomisedSnackBar from "../customisedSnackBar/CustomisedSnackBar";
import { defaultSnackState } from "../formFunctions/FormFunctions";
import axiosDefault from "../axiosDefault/axiosDefault";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import PaymentsIcon from "@mui/icons-material/Payments";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import CurrencyPoundIcon from "@mui/icons-material/CurrencyPound";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import displaySnackState from "../customisedSnackBar/DisplaySnackState";

const WeeklyCashflow = ({ startOfDate, endOfDate, reload, setReload }) => {
    const axios = axiosDefault();
    const [snackState, setSnackState] = useState(defaultSnackState);
    const [data, setData] = useState(null);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_URL_ROOT}/api/salestracker/weeklyCashflowData?start_date=${startOfDate}&end_date=${endOfDate}`);
            setData(response.data);
        } catch (error) {
            displaySnackState("Failed to load weekly cashflow data.", "error", setSnackState);
        } finally {
            if (setReload) setReload(false);
        }
    };
    useEffect(() => { fetchData(); }, [startOfDate, endOfDate, reload]);
    const summary = data?.summary || {};
    const weeklyData = data?.weeklyData || [];
    const labels = weeklyData.map((w) => w.weekLabel);
    const totalCredit = summary.totalCredit || 0;

    return (
        <Box>
            <CustomisedSnackBar {...snackState} setClosed={setSnackState} />
            <Grid container spacing={1} sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Expected (Billed)" value={summary.totalExpected} isCurrency type="dashboard" StatIcon={RequestQuoteIcon} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Received" value={summary.totalReceived} isCurrency type="dashboard" StatIcon={PaymentsIcon} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Outstanding" value={summary.totalOutstanding} isCurrency type="dashboard" StatIcon={AccountBalanceWalletIcon} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Total Invoices" value={summary.totalInvoices} type="dashboard" StatIcon={ReceiptIcon} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Paid" value={summary.paidInvoices} type="dashboard" StatIcon={CheckCircleIcon} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Unpaid" value={summary.unpaidInvoices} type="dashboard" StatIcon={PendingIcon} />
                </Grid>
            </Grid>
            <Grid container spacing={1}>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Cash" value={summary.totalCash} isCurrency type="dashboard" StatIcon={PaymentsIcon} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Card" value={summary.totalCard} isCurrency type="dashboard" StatIcon={CreditCardIcon} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="BACS" value={summary.totalBacs} isCurrency type="dashboard" StatIcon={AccountBalanceIcon} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Credit" value={totalCredit} isCurrency type="dashboard" StatIcon={CurrencyPoundIcon} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Contra" value={summary.totalContra} isCurrency type="dashboard" StatIcon={AccountBalanceIcon} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <StatCard title="Partially Paid" value={summary.partiallyPaidInvoices || 0} type="dashboard" StatIcon={PendingIcon} />
                </Grid>
            </Grid>
            {weeklyData.length === 0 ? (
                <Typography sx={{ mt: 3, color: "text.secondary" }}> No weeks in the selected period. </Typography>
            ) : (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <BarChart
                            title="Expected vs Received (weekly)"
                            labels={labels}
                            data1={weeklyData.map((w) => w.expected || 0)}
                            data2={weeklyData.map((w) => w.received || 0)}
                            datasetLabel1="Expected (£)"
                            datasetLabel2="Received (£)"
                            height={420}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <LineProgress
                            title="Payment Methods Over Time (weekly)"
                            labels={labels}
                            series={[
                                { label: "Cash", data: weeklyData.map((w) => w.cash || 0) },
                                { label: "Card", data: weeklyData.map((w) => w.card || 0) },
                                { label: "BACS", data: weeklyData.map((w) => w.bacs || 0) },
                                { label: "Cheque", data: weeklyData.map((w) => w.cheque || 0) },
                                { label: "Credit", data: weeklyData.map((w) => w.credit || 0) },
                            ]}
                            height={480}
                        />
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default WeeklyCashflow;