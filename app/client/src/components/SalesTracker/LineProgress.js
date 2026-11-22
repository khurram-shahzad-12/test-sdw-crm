import { Paper, Box, Typography, Tooltip, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const COLORS = ["#3f51b5", "#82ca9d", "#ff9800", "#e91e63", "#00bcd4", "#9c27b0"];
const LineProgress = ({ title = "", labels = [], series = [], height = 480, maxPerRow = false, }) => {
  const theme = useTheme();
  const textColor = theme.palette.text.primary;
  const mutedColor = theme.palette.text.secondary;
  const trackColor = theme.palette.action.hover;
  const coloredSeries = series.map((s, i) => ({ ...s, color: s.color || COLORS[i % COLORS.length], }));
  const globalMax = Math.max( 1, ...coloredSeries.flatMap((s) => s.data.map((v) => Number(v) || 0)) );
  return (
    <Paper sx={{ p: 2, mb: 2, height, overflowY: "auto" }}>
      {title && (
        <Typography variant="subtitle1" sx={{ color: textColor, fontWeight: "bold", mb: 1 }} > {title} </Typography>
      )}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {labels.map((label, idx) => {
          const perRowMax = maxPerRow ? Math.max(1, ...coloredSeries.map((s) => Number(s.data[idx]) || 0)) : globalMax;
          return (
            <Box
              key={label + idx}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <Box sx={{ width: 130, flexShrink: 0 }}>
                <Typography variant="caption" sx={{ color: mutedColor }}> {label} </Typography>
              </Box>
              <Stack spacing={0.5} sx={{ flex: 1 }}>
                {coloredSeries.map((s) => {
                  const value = Number(s.data[idx]) || 0;
                  const pct = Math.min(100, (value / perRowMax) * 100);
                  return (
                    <Tooltip
                      key={s.label}
                      title={`${s.label}: £${value.toLocaleString("en-GB")}`}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{ flex: 1, height: 10, borderRadius: 1, bgcolor: trackColor, position: "relative", overflow: "hidden",  }} >
                          <Box sx={{ position: "absolute", inset: 0, width: `${pct}%`, bgcolor: s.color, borderRadius: 1, transition: "width 250ms ease", }} />
                        </Box>
                        <Box sx={{ width: 120, textAlign: "right", flexShrink: 0 }}>
                          <Typography variant="caption" sx={{ color: textColor }}> {s.label}: £{value.toLocaleString("en-GB")} </Typography>
                        </Box>
                      </Box>
                    </Tooltip>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default LineProgress;