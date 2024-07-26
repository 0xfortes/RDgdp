import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { FormControl, InputLabel, MenuItem, Select, Box, Typography } from '@mui/material';

// Register the required components
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const ExpenditureBarChart = () => {
  const [chartData, setChartData] = useState(null);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    axios.get('http://localhost:8000/api/expenditures/')
      .then(response => {
        const data = response.data;
        const countries = [...new Set(data.map(item => item.country))].sort(); // Sort alphabetically
        const years = [...new Set(data.map(item => item.year))].sort(); // Sort years
        setCountries(countries);
        setYears(years);

        if (countries.length > 0) {
          setSelectedCountry(countries[0]);
          setSelectedYear(years[0]);
          updateChartData(countries[0], years[0], data);
        }
      })
      .catch(error => {
        console.error('There was an error fetching the data!', error);
      });
  }, []);

  useEffect(() => {
    if (selectedCountry && selectedYear) {
      axios.get('http://localhost:8000/api/expenditures/')
        .then(response => {
          const data = response.data;
          updateChartData(selectedCountry, selectedYear, data);
        })
        .catch(error => {
          console.error('There was an error fetching the data!', error);
        });
    }
  }, [selectedCountry, selectedYear]);

  const updateChartData = (country, year, data) => {
    const countryData = data.filter(item => item.country === country && item.year === year);

    let sectors = [...new Set(data.map(item => item.sector))];
    sectors = sectors.sort((a, b) => (a === 'TOTAL' ? 1 : b === 'TOTAL' ? -1 : 0));

    const datasets = [{
      label: year,
      data: sectors.map(sector => {
        const record = countryData.find(item => item.sector === sector);
        return record ? record.percentage_of_gdp : 0;
      }),
      backgroundColor: sectors.map(() => getRandomColor())
    }];

    setChartData({
      labels: sectors,
      datasets: datasets
    });
  };

  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <div style={{ width: '600px', margin: '0 auto' }}>
      <h2>Expenditure Bar Chart</h2>
      <FormControl fullWidth style={{ marginBottom: '20px' }}>
        <InputLabel id="country-select-label">Country</InputLabel>
        <Select
          labelId="country-select-label"
          value={selectedCountry}
          label="Country"
          onChange={handleCountryChange}
        >
          {countries.map(country => (
            <MenuItem key={country} value={country}>{country}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth style={{ marginBottom: '20px' }}>
        <InputLabel id="year-select-label">Year</InputLabel>
        <Select
          labelId="year-select-label"
          value={selectedYear}
          label="Year"
          onChange={handleYearChange}
        >
          {years.map(year => (
            <MenuItem key={year} value={year}>{year}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {chartData ? (
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top',
              },
              title: {
                display: true,
                text: 'R&D Expenditure as Percentage of GDP by Sector'
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Sector'
                }
              },
              y: {
                title: {
                  display: true,
                  text: 'Percentage of GDP (%)'
                },
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              }
            }
          }}
        />
      ) : (
        <p>Loading data...</p>
      )}
      <Box mt={4}>
        <Typography variant="h6">Legend</Typography>
        <Typography variant="body1"><strong>HES:</strong> Higher education sector</Typography>
        <Typography variant="body1"><strong>BES:</strong> Business enterprise sector</Typography>
        <Typography variant="body1"><strong>PNP:</strong> Private non-profit sector</Typography>
        <Typography variant="body1"><strong>GOV:</strong> Government sector</Typography>
        <Typography variant="body1"><strong>TOTAL:</strong> All sectors</Typography>
      </Box>
    </div>
  );
};

export default ExpenditureBarChart;
