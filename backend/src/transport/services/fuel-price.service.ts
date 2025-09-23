import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import * as cheerio from 'cheerio';
import { firstValueFrom } from 'rxjs';

export interface FuelPrice {
  petrol: number;
  diesel: number;
  lpg?: number;
  currency: string;
  lastUpdated: string;
  source: string;
}

@Injectable()
export class FuelPriceService {
  private readonly logger = new Logger(FuelPriceService.name);

  // Updated with multiple sources in priority order
  private readonly fuelPriceApis = [
    'npa-scraper', // National Petroleum Authority (highest priority)
    'cedirates-scraper', // CediRates (current implementation)
    'citinews-scraper', // Citi News Room (fallback)
    'joyonline-scraper', // Joy Online (fallback)
    'ghanaweb-scraper', // GhanaWeb (fallback)
  ];

  private readonly FUEL_PRICE_CACHE_KEY = 'fuel_prices';

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Calculate TTL (time-to-live) in seconds until 11:59 PM today
   * If it's already past 11:59 PM, calculate until 11:59 PM tomorrow
   */
  private getCacheTTL(): number {
    const now = new Date();
    const targetTime = new Date();

    // Set target time to 11:59:59 PM today
    targetTime.setHours(23, 59, 59, 999);

    // If we're already past 11:59 PM, set target to tomorrow
    if (now > targetTime) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    const timeDiff = targetTime.getTime() - now.getTime();
    const ttlSeconds = Math.ceil(timeDiff / 1000);

    this.logger.debug(
      `Cache TTL calculated: ${ttlSeconds} seconds until ${targetTime.toISOString()}`,
    );
    return ttlSeconds;
  }

  async getFuelPrices(): Promise<FuelPrice> {
    // Check cache first
    const cachedPrices = await this.cacheManager.get<FuelPrice>(
      this.FUEL_PRICE_CACHE_KEY,
    );
    if (cachedPrices) {
      this.logger.debug('Returning cached fuel prices');
      return cachedPrices;
    }

    this.logger.debug('No cached fuel prices found, fetching from APIs');

    let lastError: Error | null = null;

    // Try each source in order until we get valid data
    for (const api of this.fuelPriceApis) {
      try {
        let fuelPrices: FuelPrice;

        switch (api) {
          case 'npa-scraper':
            fuelPrices = await this.getFuelPricesFromNPA();
            break;
          case 'cedirates-scraper':
            fuelPrices = await this.getFuelPricesFromCediRates();
            break;
          case 'citinews-scraper':
            fuelPrices = await this.getFuelPricesFromCitiNews();
            break;
          case 'joyonline-scraper':
            fuelPrices = await this.getFuelPricesFromJoyOnline();
            break;
          case 'ghanaweb-scraper':
            fuelPrices = await this.getFuelPricesFromGhanaWeb();
            break;
          default:
            continue;
        }

        // Validate that we have non-zero prices
        if (this.isValidFuelPriceData(fuelPrices)) {
          // Cache the result with TTL until 11:59 PM
          const ttl = this.getCacheTTL();
          await this.cacheManager.set(
            this.FUEL_PRICE_CACHE_KEY,
            fuelPrices,
            ttl * 1000,
          );
          this.logger.log(
            `Successfully fetched and cached fuel prices from ${api}`,
          );
          return fuelPrices;
        } else {
          this.logger.warn(
            `Invalid fuel price data from ${api}: ${JSON.stringify(fuelPrices)}`,
          );
          lastError = new Error(`Invalid fuel price data from ${api}`);
          continue;
        }
      } catch (error) {
        lastError = error;
        this.logger.warn(`Fuel prices from ${api} failed: ${error.message}`);
        continue;
      }
    }

    // If we reach here, all sources failed
    this.logger.error(
      'All fuel price sources failed, returning default zero values',
    );

    // Return zero values as last resort
    const zeroPrices: FuelPrice = {
      petrol: 0,
      diesel: 0,
      lpg: 0,
      currency: 'GHS',
      lastUpdated: new Date().toISOString(),
      source: 'All sources failed - returning zero values',
    };

    // Cache zero values for a shorter period (1 hour) to avoid repeated failed requests
    await this.cacheManager.set(
      this.FUEL_PRICE_CACHE_KEY,
      zeroPrices,
      3600 * 1000,
    );

    return zeroPrices;
  }

  // Helper method to validate fuel price data
  private isValidFuelPriceData(data: FuelPrice): boolean {
    return (
      data &&
      typeof data.petrol === 'number' &&
      typeof data.diesel === 'number' &&
      data.petrol > 0 &&
      data.diesel > 0 &&
      data.currency === 'GHS' &&
      data.petrol < 50 && // Sanity check - prices shouldn't be over 50 GHS
      data.diesel < 50
    );
  }

  private async getFuelPricesFromCediRates(): Promise<FuelPrice> {
    const url = 'https://cedirates.com/fuel-prices/gh/';
    const response = await firstValueFrom(
      this.httpService.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GhanaAPI/1.0)',
        },
      }),
    );

    return this.parseCediRatesFuelPrices(response.data);
  }

  private parseCediRatesFuelPrices(html: string): FuelPrice {
    try {
      const $ = cheerio.load(html);

      // Target companies: Shell, Goil, Total, Star Oil
      const targetCompanies = [
        'Shell',
        'Goil',
        'Total',
        'StarOil',
        'TotalEnergies',
      ];
      const targetCompaniesLower = targetCompanies.map((company) =>
        company.toLowerCase(),
      );
      const petrolPrices: number[] = [];
      const dieselPrices: number[] = [];
      const lpgPrices: number[] = [];

      // Parse fuel prices from CediRates table
      $('table tr').each((index, element) => {
        const row = $(element);
        const cells = row.find('td');

        // Need at least 4 cells (company name, petrol, diesel, premium/lpg)
        if (cells.length >= 4) {
          const companyName = cells.eq(1).text().trim().replace(/Get$/, ''); // Remove "Get" suffix
          const companyNameLower = companyName.toLowerCase();
          const petrolText = cells.eq(2).text().trim();
          const dieselText = cells.eq(3).text().trim();
          const lpgText = cells.length > 4 ? cells.eq(4).text().trim() : '';

          // Check if this company is one of our targets
          const isTargetCompany = targetCompaniesLower.some((target) =>
            companyNameLower.includes(target),
          );

          if (isTargetCompany) {
            // Extract petrol price
            const petrolPrice = parseFloat(petrolText.replace(/[^\d.]/g, ''));

            // Extract diesel price
            const dieselPrice = parseFloat(dieselText.replace(/[^\d.]/g, ''));

            // Extract LPG price if available
            const lpgPrice = parseFloat(lpgText.replace(/[^\d.]/g, ''));

            if (!isNaN(petrolPrice) && petrolPrice > 0) {
              petrolPrices.push(petrolPrice);
            }

            if (!isNaN(dieselPrice) && dieselPrice > 0) {
              dieselPrices.push(dieselPrice);
            }

            if (!isNaN(lpgPrice) && lpgPrice > 0) {
              lpgPrices.push(lpgPrice);
            }

            this.logger.debug(
              `Parsed ${companyName}: Petrol=${petrolPrice}, Diesel=${dieselPrice}, LPG=${lpgPrice}`,
            );
          }
        }
      });

      // Calculate averages
      const avgPetrol =
        petrolPrices.length > 0
          ? petrolPrices.reduce((sum, price) => sum + price, 0) /
            petrolPrices.length
          : 0;

      const avgDiesel =
        dieselPrices.length > 0
          ? dieselPrices.reduce((sum, price) => sum + price, 0) /
            dieselPrices.length
          : 0;

      const avgLpg =
        lpgPrices.length > 0
          ? lpgPrices.reduce((sum, price) => sum + price, 0) / lpgPrices.length
          : undefined;

      this.logger.debug(
        `CediRates averages: Petrol=${avgPetrol}, Diesel=${avgDiesel}, LPG=${avgLpg}`,
      );

      return {
        petrol: Math.round(avgPetrol * 100) / 100, // Round to 2 decimal places
        diesel: Math.round(avgDiesel * 100) / 100,
        lpg: avgLpg ? Math.round(avgLpg * 100) / 100 : undefined,
        currency: 'GHS',
        lastUpdated: new Date().toISOString(),
        source: 'CediRates.com (Shell, Goil, Total, Star Oil Average)',
      };
    } catch (error) {
      this.logger.error(`Failed to parse CediRates HTML: ${error.message}`);
      throw error;
    }
  }

  private async getFuelPricesFromNPA(): Promise<FuelPrice> {
    try {
      // Try to get data from NPA's latest press releases or news section
      const url = 'https://npa.gov.gh/category/press-releases/';
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; GhanaAPI/1.0)',
          },
        }),
      );

      const $ = cheerio.load(response.data);
      let petrolPrice = 0;
      let dieselPrice = 0;
      let lpgPrice = 0;

      // Look for the latest press release about fuel prices
      const pressReleases = $(
        '.entry-title a, .post-title a, h3 a, h2 a',
      ).slice(0, 10);

      for (let i = 0; i < pressReleases.length; i++) {
        const titleElement = pressReleases.eq(i);
        const title = titleElement.text().toLowerCase();
        const link = titleElement.attr('href');

        // Check if this is a fuel price related announcement
        if (
          link &&
          (title.includes('fuel') ||
            title.includes('petroleum') ||
            title.includes('price') ||
            title.includes('petrol') ||
            title.includes('diesel') ||
            title.includes('indicative'))
        ) {
          this.logger.debug(`Checking NPA article: ${title}`);

          try {
            const articleResponse = await firstValueFrom(
              this.httpService.get(link, {
                timeout: 10000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; GhanaAPI/1.0)',
                },
              }),
            );

            const article$ = cheerio.load(articleResponse.data);
            const articleText = article$(
              '.entry-content, .post-content, .content, .article-content',
            ).text();

            // Extract prices using regex patterns for GHS
            const petrolMatches = articleText.match(
              /(?:petrol|gasoline).*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi,
            );
            const dieselMatches = articleText.match(
              /diesel.*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi,
            );
            const lpgMatches = articleText.match(
              /(?:lpg|liquefied petroleum gas).*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi,
            );

            if (petrolMatches && petrolMatches.length > 0) {
              const priceMatch = petrolMatches[0].match(/(\d+\.?\d*)/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 5 && price < 50) {
                  // Sanity check
                  petrolPrice = price;
                  this.logger.debug(`Found NPA petrol price: ${petrolPrice}`);
                }
              }
            }

            if (dieselMatches && dieselMatches.length > 0) {
              const priceMatch = dieselMatches[0].match(/(\d+\.?\d*)/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 5 && price < 50) {
                  // Sanity check
                  dieselPrice = price;
                  this.logger.debug(`Found NPA diesel price: ${dieselPrice}`);
                }
              }
            }

            if (lpgMatches && lpgMatches.length > 0) {
              const priceMatch = lpgMatches[0].match(/(\d+\.?\d*)/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 3 && price < 30) {
                  // Sanity check for LPG
                  lpgPrice = price;
                  this.logger.debug(`Found NPA LPG price: ${lpgPrice}`);
                }
              }
            }

            // If we found both petrol and diesel prices, we can return
            if (petrolPrice > 0 && dieselPrice > 0) {
              break;
            }
          } catch (articleError) {
            this.logger.debug(
              `Failed to fetch NPA article ${link}: ${articleError.message}`,
            );
            continue;
          }
        }
      }

      if (petrolPrice === 0 && dieselPrice === 0) {
        throw new Error('No valid fuel prices found in NPA press releases');
      }

      return {
        petrol: Math.round(petrolPrice * 100) / 100,
        diesel: Math.round(dieselPrice * 100) / 100,
        lpg: lpgPrice > 0 ? Math.round(lpgPrice * 100) / 100 : undefined,
        currency: 'GHS',
        lastUpdated: new Date().toISOString(),
        source: 'National Petroleum Authority (NPA)',
      };
    } catch (error) {
      this.logger.error(`Failed to fetch NPA fuel prices: ${error.message}`);
      throw error;
    }
  }

  private async getFuelPricesFromCitiNews(): Promise<FuelPrice> {
    try {
      const url = 'https://citinewsroom.com/tag/fuel-prices/';
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; GhanaAPI/1.0)',
          },
        }),
      );

      const $ = cheerio.load(response.data);
      let petrolPrice = 0;
      let dieselPrice = 0;
      let lpgPrice = 0;

      // Look for the latest article about fuel prices
      const latestArticles = $(
        '.entry-title a, .post-title a, h3 a, h2 a',
      ).slice(0, 5);

      for (let i = 0; i < latestArticles.length; i++) {
        const articleElement = latestArticles.eq(i);
        const articleLink = articleElement.attr('href');
        const articleTitle = articleElement.text().toLowerCase();

        if (
          articleLink &&
          (articleTitle.includes('fuel') ||
            articleTitle.includes('petrol') ||
            articleTitle.includes('diesel') ||
            articleTitle.includes('price'))
        ) {
          try {
            const articleResponse = await firstValueFrom(
              this.httpService.get(articleLink, {
                timeout: 10000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; GhanaAPI/1.0)',
                },
              }),
            );

            const article$ = cheerio.load(articleResponse.data);
            const articleText = article$(
              '.entry-content, .post-content, .content',
            ).text();

            // Extract prices using improved regex patterns
            const petrolRegex =
              /(?:petrol|gasoline).*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi;
            const dieselRegex = /diesel.*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi;
            const lpgRegex = /(?:lpg|gas).*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi;

            const petrolMatches = articleText.match(petrolRegex);
            const dieselMatches = articleText.match(dieselRegex);
            const lpgMatches = articleText.match(lpgRegex);

            if (petrolMatches) {
              const priceMatch = petrolMatches[0].match(/(\d+\.?\d*)/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 5 && price < 50) {
                  petrolPrice = price;
                }
              }
            }

            if (dieselMatches) {
              const priceMatch = dieselMatches[0].match(/(\d+\.?\d*)/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 5 && price < 50) {
                  dieselPrice = price;
                }
              }
            }

            if (lpgMatches) {
              const priceMatch = lpgMatches[0].match(/(\d+\.?\d*)/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 3 && price < 30) {
                  lpgPrice = price;
                }
              }
            }

            if (petrolPrice > 0 && dieselPrice > 0) {
              break;
            }
          } catch (articleError) {
            this.logger.debug(
              `Failed to fetch Citi News article: ${articleError.message}`,
            );
            continue;
          }
        }
      }

      if (petrolPrice === 0 && dieselPrice === 0) {
        throw new Error('No valid fuel prices found in Citi News articles');
      }

      return {
        petrol: Math.round(petrolPrice * 100) / 100,
        diesel: Math.round(dieselPrice * 100) / 100,
        lpg: lpgPrice > 0 ? Math.round(lpgPrice * 100) / 100 : undefined,
        currency: 'GHS',
        lastUpdated: new Date().toISOString(),
        source: 'Citi News Room',
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch Citi News fuel prices: ${error.message}`,
      );
      throw error;
    }
  }

  private async getFuelPricesFromJoyOnline(): Promise<FuelPrice> {
    try {
      const url = 'https://www.myjoyonline.com/tag/fuel-prices/';
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; GhanaAPI/1.0)',
          },
        }),
      );

      const $ = cheerio.load(response.data);
      let petrolPrice = 0;
      let dieselPrice = 0;
      let lpgPrice = 0;

      // Look for latest article about fuel prices
      const latestArticles = $(
        '.post-title a, .entry-title a, h3 a, h2 a',
      ).slice(0, 5);

      for (let i = 0; i < latestArticles.length; i++) {
        const articleElement = latestArticles.eq(i);
        const articleLink = articleElement.attr('href');
        const articleTitle = articleElement.text().toLowerCase();

        if (
          articleLink &&
          (articleTitle.includes('fuel') ||
            articleTitle.includes('petrol') ||
            articleTitle.includes('diesel') ||
            articleTitle.includes('price'))
        ) {
          try {
            const articleResponse = await firstValueFrom(
              this.httpService.get(articleLink, {
                timeout: 10000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; GhanaAPI/1.0)',
                },
              }),
            );

            const article$ = cheerio.load(articleResponse.data);
            const articleText = article$(
              '.entry-content, .post-content, .content, .article-body',
            ).text();

            // Extract prices using regex
            const petrolRegex =
              /(?:petrol|gasoline).*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi;
            const dieselRegex = /diesel.*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi;
            const lpgRegex = /(?:lpg|gas).*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi;

            const petrolMatches = articleText.match(petrolRegex);
            const dieselMatches = articleText.match(dieselRegex);
            const lpgMatches = articleText.match(lpgRegex);

            if (petrolMatches) {
              const priceMatch = petrolMatches[0].match(/(\d+\.?\d*)/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 5 && price < 50) {
                  petrolPrice = price;
                }
              }
            }

            if (dieselMatches) {
              const priceMatch = dieselMatches[0].match(/(\d+\.?\d*)/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 5 && price < 50) {
                  dieselPrice = price;
                }
              }
            }

            if (lpgMatches) {
              const priceMatch = lpgMatches[0].match(/(\d+\.?\d*)/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 3 && price < 30) {
                  lpgPrice = price;
                }
              }
            }

            if (petrolPrice > 0 && dieselPrice > 0) {
              break;
            }
          } catch (articleError) {
            this.logger.debug(
              `Failed to fetch Joy Online article: ${articleError.message}`,
            );
            continue;
          }
        }
      }

      if (petrolPrice === 0 && dieselPrice === 0) {
        throw new Error('No valid fuel prices found in Joy Online articles');
      }

      return {
        petrol: Math.round(petrolPrice * 100) / 100,
        diesel: Math.round(dieselPrice * 100) / 100,
        lpg: lpgPrice > 0 ? Math.round(lpgPrice * 100) / 100 : undefined,
        currency: 'GHS',
        lastUpdated: new Date().toISOString(),
        source: 'Joy Online',
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch Joy Online fuel prices: ${error.message}`,
      );
      throw error;
    }
  }

  private async getFuelPricesFromGhanaWeb(): Promise<FuelPrice> {
    try {
      const url = 'https://www.ghanaweb.com/GhanaHomePage/economy/';
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; GhanaAPI/1.0)',
          },
        }),
      );

      const $ = cheerio.load(response.data);
      let petrolPrice = 0;
      let dieselPrice = 0;
      let lpgPrice = 0;

      // Look for latest articles about fuel prices
      const latestArticles = $(
        'a[href*="fuel"], a[href*="petrol"], a[href*="diesel"], a[href*="price"]',
      ).slice(0, 10);

      for (let i = 0; i < latestArticles.length; i++) {
        const articleElement = latestArticles.eq(i);
        const articleLink = articleElement.attr('href');
        const articleTitle = articleElement.text().toLowerCase();

        if (
          articleLink &&
          (articleTitle.includes('fuel') ||
            articleTitle.includes('petrol') ||
            articleTitle.includes('diesel') ||
            articleTitle.includes('price'))
        ) {
          // Ensure we have a full URL
          const fullUrl = articleLink.startsWith('http')
            ? articleLink
            : `https://www.ghanaweb.com${articleLink}`;

          try {
            const articleResponse = await firstValueFrom(
              this.httpService.get(fullUrl, {
                timeout: 10000,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; GhanaAPI/1.0)',
                },
              }),
            );

            const article$ = cheerio.load(articleResponse.data);
            const articleText = article$(
              '.article-content, .story-content, .content, .entry-content',
            ).text();

            // Extract prices using regex
            const petrolRegex =
              /(?:petrol|gasoline).*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi;
            const dieselRegex = /diesel.*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi;
            const lpgRegex = /(?:lpg|gas).*?(?:gh¢|ghs|cedi)?\s*(\d+\.?\d*)/gi;

            const petrolMatches = articleText.match(petrolRegex);
            const dieselMatches = articleText.match(dieselRegex);
            const lpgMatches = articleText.match(lpgRegex);

            if (petrolMatches) {
              const priceMatch = petrolMatches[0].match(/(\d+\.?\d*)/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 5 && price < 50) {
                  petrolPrice = price;
                }
              }
            }

            if (dieselMatches) {
              const priceMatch = dieselMatches[0].match(/(\d+\.?\d*)/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 5 && price < 50) {
                  dieselPrice = price;
                }
              }
            }

            if (lpgMatches) {
              const priceMatch = lpgMatches[0].match(/(\d+\.?\d*)/);
              if (priceMatch) {
                const price = parseFloat(priceMatch[1]);
                if (price > 3 && price < 30) {
                  lpgPrice = price;
                }
              }
            }

            if (petrolPrice > 0 && dieselPrice > 0) {
              break;
            }
          } catch (articleError) {
            this.logger.debug(
              `Failed to fetch GhanaWeb article: ${articleError.message}`,
            );
            continue;
          }
        }
      }

      if (petrolPrice === 0 && dieselPrice === 0) {
        throw new Error('No valid fuel prices found in GhanaWeb articles');
      }

      return {
        petrol: Math.round(petrolPrice * 100) / 100,
        diesel: Math.round(dieselPrice * 100) / 100,
        lpg: lpgPrice > 0 ? Math.round(lpgPrice * 100) / 100 : undefined,
        currency: 'GHS',
        lastUpdated: new Date().toISOString(),
        source: 'GhanaWeb',
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch GhanaWeb fuel prices: ${error.message}`,
      );
      throw error;
    }
  }
}
