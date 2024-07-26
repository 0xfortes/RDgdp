import requests
from django.core.management.base import BaseCommand
from expenditure.models import Expenditure

class Command(BaseCommand):
    help = 'Fetch data from Eurostat API and save to database'

    def handle(self, *args, **kwargs):
        url = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/tsc00001?format=JSON&unit=PC_GDP&sectperf=TOTAL&sectperf=BES&sectperf=GOV&sectperf=HES&sectperf=PNP&lang=en"
        response = requests.get(url)
        data = response.json()

        dimension = data['dimension']
        countries = dimension['geo']['category']['index']
        sectors = dimension['sectperf']['category']['index']
        years = dimension['time']['category']['index']

        index_to_country = {v: k for k, v in countries.items()}
        index_to_sector = {v: k for k, v in sectors.items()}
        index_to_year = {v: k for k, v in years.items()}

        for record_key, percentage_of_gdp in data['value'].items():
            index = int(record_key)
            num_sectors = len(sectors)
            num_years = len(years)
            num_countries = len(countries)

            country_index = index // (num_sectors * num_years)
            sector_index = (index // num_years) % num_sectors
            year_index = index % num_years

            country = index_to_country.get(country_index)
            sector = index_to_sector.get(sector_index)
            year = index_to_year.get(year_index)

            if country and sector and year:
                Expenditure.objects.update_or_create(
                    country=country,
                    sector=sector,
                    year=int(year),
                    defaults={'percentage_of_gdp': percentage_of_gdp}
                )
            else:
                print(f"Unexpected index mapping: {record_key}")

        self.stdout.write(self.style.SUCCESS('Data fetched successfully'))
