import { Box, Typography, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, } from '@mui/material';

const money = (n) => `£${(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2, })}`;
const VAT_BOXES = {
    output: [
        { box: '1', label: 'VAT due on sales and other outputs', key: 'box1', hint: 'Output VAT from sales' },
        { box: '2', label: 'VAT due on acquisitions from EU member states', key: 'box2', hint: 'Reverse charge on EU purchases' },
    ],
    total: [ { box: '3', label: 'Total VAT due (Box 1 + Box 2)', key: 'box3', emphasis: true }, ],
    input: [ { box: '4', label: 'VAT reclaimed on purchases and other inputs', key: 'box4', hint: 'Reclaimable inventory + expense VAT' }, ],
    net: [ { box: '5', label: 'Net VAT to pay to HMRC or reclaim', key: 'box5', emphasis: true, highlight: true }, ],
    values: [
        { box: '6', label: 'Total value of sales excluding VAT', key: 'box6' }, { box: '7', label: 'Total value of purchases excluding VAT', key: 'box7' },
    ],
    eu: [
        { box: '8', label: 'Total value of dispatches to EU member states', key: 'box8' }, { box: '9', label: 'Total value of acquisitions from EU member states', key: 'box9' },
    ],
};

const BoxRow = ({ DARK, box, label, hint, value, emphasis, highlight }) => {
    const isNegative = value < 0;
    const amountColor = highlight ? isNegative ? DARK.accentGreen : DARK.accentRed : DARK.textPrimary;
    return (
        <TableRow
            sx={{
                backgroundColor: emphasis ? DARK.selected : 'transparent',
                '&:last-child td': { borderBottom: 0 },
                '&:hover': { backgroundColor: emphasis ? DARK.selected : DARK.hover },
                '& td': { borderBottom: `1px solid ${DARK.border}` },
            }}
        >
            <TableCell sx={{ width: 70, py: 1.5, borderBottom: `1px solid ${DARK.border}` }}>
                <Box
                    sx={{
                        width: 36, height: 36, borderRadius: 1.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14,
                        backgroundColor: emphasis ? DARK.accentBlue : DARK.cardBgAlt,
                        color: emphasis ? '#fff' : DARK.textPrimary,
                        border: emphasis ? 'none' : `1px solid ${DARK.border}`,
                    }}
                > {box} </Box>
            </TableCell>
            <TableCell sx={{ py: 1.5, borderBottom: `1px solid ${DARK.border}` }}>
                <Typography variant="body2" sx={{ fontWeight: emphasis ? 600 : 500, color: DARK.textPrimary }}> {label} </Typography>
                {hint && ( <Typography variant="caption" sx={{ display: 'block', mt: 0.25, color: DARK.textMuted }}> {hint} </Typography> )}
            </TableCell>
            <TableCell align="right" sx={{ py: 1.5, width: 200, borderBottom: `1px solid ${DARK.border}` }}>
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: emphasis ? 700 : 600,
                        color: amountColor,
                        fontVariantNumeric: 'tabular-nums',
                    }}
                >
                    {money(value)}
                </Typography>
            </TableCell>
        </TableRow>
    );
};

const SectionHeader = ({ DARK, title, subtitle, color }) => {
    const barColor = color || DARK.accentBlue;
    return (
        <TableRow>
            <TableCell
                colSpan={3}
                sx={{
                    py: 1,
                    backgroundColor: DARK.cardBgAlt,
                    borderBottom: `1px solid ${DARK.border}`,
                    borderTop: `1px solid ${DARK.border}`,
                }}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 4, height: 18, borderRadius: 1, backgroundColor: barColor }} />
                    <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: DARK.textSecondary }}
                    > {title} </Typography>
                    {subtitle && (
                        <Typography variant="caption" sx={{ fontStyle: 'italic', color: DARK.textMuted }}> · {subtitle} </Typography>
                    )}
                </Stack>
            </TableCell>
        </TableRow>
    );
};

const VatBoxTable = ({ DARK, d }) => (
    <TableContainer
        component={Paper}
        variant="outlined"
        sx={{
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: DARK.cardBg,
            borderColor: DARK.border,
        }}
    >
        <Table size="small">
            <TableHead>
                <TableRow sx={{ backgroundColor: DARK.cardBgAlt }}>
                    <TableCell sx={{ fontWeight: 700, width: 70, color: DARK.textPrimary, borderBottom: `1px solid ${DARK.border}` }}> Box </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: DARK.textPrimary, borderBottom: `1px solid ${DARK.border}` }}> Description </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, width: 200, color: DARK.textPrimary, borderBottom: `1px solid ${DARK.border}` }}> Amount </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                <SectionHeader DARK={DARK} title="VAT Due" subtitle="Output tax on sales & acquisitions" color={DARK.accentBlue} />
                {VAT_BOXES.output.map((r) => ( <BoxRow DARK={DARK} key={r.box} {...r} value={d[r.key]} /> ))}
                <SectionHeader DARK={DARK} title="Total VAT Due" subtitle="Box 1 + Box 2" color={DARK.accentPurple} />
                {VAT_BOXES.total.map((r) => ( <BoxRow DARK={DARK} key={r.box} {...r} value={d[r.key]} /> ))}
                <SectionHeader DARK={DARK} title="VAT Reclaimed" subtitle="Input tax on purchases & expenses" color={DARK.accentGreen} />
                {VAT_BOXES.input.map((r) => ( <BoxRow DARK={DARK} key={r.box} {...r} value={d[r.key]} /> ))}
                <SectionHeader DARK={DARK} title="Net VAT" subtitle="Box 3 − Box 4" color={DARK.accentRed} />
                {VAT_BOXES.net.map((r) => ( <BoxRow DARK={DARK} key={r.box} {...r} value={d[r.key]} /> ))}
                <SectionHeader DARK={DARK} title="Total Values" subtitle="Excluding VAT" color={DARK.textSecondary} />
                {VAT_BOXES.values.map((r) => ( <BoxRow DARK={DARK} key={r.box} {...r} value={d[r.key]} /> ))}
                <SectionHeader DARK={DARK} title="EU / Northern Ireland" subtitle="Dispatches & acquisitions" color={DARK.accentYellow} />
                {VAT_BOXES.eu.map((r) => ( <BoxRow DARK={DARK} key={r.box} {...r} value={d[r.key]} /> ))}
            </TableBody>
        </Table>
    </TableContainer>
);

export default VatBoxTable;