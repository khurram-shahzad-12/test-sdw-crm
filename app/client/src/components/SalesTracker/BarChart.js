import { Box, Paper } from "@mui/material";
import { Bar } from "react-chartjs-2";
import { useTheme } from "@emotion/react";

const BarChart = ({title="", labels = [], data1 = [], data2 = [], datasetLabel1 = "", datasetLabel2 = "", height = 550}) => {
    const theme = useTheme();
    const textColor = theme.palette.text.primary;
    const gridColor = theme.palette.divider;
    const tooltipBg = theme.palette.background.paper;
    const tooltipBorder = theme.palette.divider;
    const tooltipText = theme.palette.text.primary;

     const chartData = {
        labels,
        datasets: [
            {
                label: datasetLabel1,
                data: data1,
                backgroundColor: '#3f51b5',
            },
            {
                label: datasetLabel2,
                data: data2,
                backgroundColor: '#82ca9d',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: data2.length > 0 ? true : false,
                position: 'top',
                labels: { color: textColor }
            },
            title: {
                display: true,
                text: title,
                color: textColor,
                font: { size: 16, weight: "bold" }
            },
            tooltip: {titleColor: textColor, bodyColor: textColor, backgroundColor:tooltipBg, borderColor: tooltipBorder, borderWidth: 1, padding: 10, displayColors: true, titleFont: {weight:'bold'}},
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: textColor },
                grid: { color: gridColor, borderColor: gridColor }
            },
            x: {
                ticks: { color: textColor },
                grid: { color: gridColor, borderColor: gridColor }
            }
        },
    };

  return (
    <Paper sx={{ p: 2, mb: 2, height }}><Box sx={{ width: "100%", height: "100%" }}><Bar options={chartOptions} data={chartData}/></Box></Paper>  
  )
}

export default BarChart