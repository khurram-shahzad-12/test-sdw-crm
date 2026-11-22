import { Pie } from "react-chartjs-2";
import { useTheme } from "@emotion/react";

const PieChart = ({ title = "", labels = [], data = [], legendPosition = "left", labelsPadding = 30, currencySymbol=true }) => {
    const theme = useTheme();
    const textColor = theme.palette.text.primary;
    const chartData = {
        labels,
        datasets: [
            {
                label: 'Sales (£)',
                data,
                backgroundColor: ['#4caf50','#BF3A21','#0088FE', '#FFBB28', '#FF8042', '#8884D8', '#ffffff', '#000000', '#21BABF', '#149128'],
                borderWidth: 1,
                borderColor: theme.palette.divider,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: legendPosition,
                // align: "start",
                labels: { usePointStyle: true, padding: labelsPadding, color: textColor },
            },
            title: {
                display: true,
                text: title,
                color: textColor,
                font: {
                    size: 16,
                    weight: 'bold'
                },
                padding: {
                    top: 10, bottom: 20
                }
            },
            tooltip: {
                textColor: textColor,
                bodyColor: textColor,
                callbacks: {
                    label: function (context) {
                        return `${currencySymbol? "£":''} ${context.raw}`;
                    }
                }
            }
        },
    };
    return (<Pie options={chartOptions} data={chartData} />)
}

export default PieChart;