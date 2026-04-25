import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EnergyMarket {
  id: string;
  name: string;
  region: string;
  countryCode: string;
  type: 'day_ahead' | 'intraday' | 'balancing' | 'capacity' | 'ancillary';
  status: 'active' | 'suspended' | 'closed';
  currency: string;
  timezone: string;
  tradingHours: {
    open: string;
    close: string;
  };
  settlementPeriod: number; // minutes
  minimumBidSize: number; // MWh
  maximumBidSize: number; // MWh
  priceCap: number; // USD/MWh
  priceFloor: number; // USD/MWh
  participants: number;
  volume: number; // MWh daily average
  lastUpdated: Date;
}

export interface MarketBid {
  id: string;
  marketId: string;
  participantId: string;
  type: 'supply' | 'demand';
  volume: number; // MWh
  price: number; // USD/MWh
  currency: string;
  duration: number; // minutes
  deliveryPeriod: {
    start: Date;
    end: Date;
  };
  status: 'submitted' | 'accepted' | 'rejected' | 'partially_filled' | 'filled';
  priority: 'must_run' | 'economic' | 'optional';
  constraints: string[];
  submittedAt: Date;
  acceptedAt?: Date;
  filledVolume?: number;
  averagePrice?: number;
}

export interface MarketTransaction {
  id: string;
  bidId: string;
  counterpartyBidId?: string;
  marketId: string;
  volume: number; // MWh
  price: number; // USD/MWh
  currency: string;
  value: number; // USD
  executionTime: Date;
  deliveryPeriod: {
    start: Date;
    end: Date;
  };
  status: 'executed' | 'cancelled' | 'pending';
  transactionCost: number;
  clearingPrice: number;
  congestionCost?: number;
}

export interface MarketClearing {
  id: string;
  marketId: string;
  clearingDate: Date;
  settlementPeriod: Date;
  supplyCurve: Array<{
    price: number;
    volume: number;
  }>;
  demandCurve: Array<{
    price: number;
    volume: number;
  }>;
  clearingPrice: number;
  clearingVolume: number;
  surplus: number;
  congestionZones: Array<{
    zoneId: string;
    congestionPrice: number;
    constrainedVolume: number;
  }>;
  executedTransactions: number;
  totalVolume: number;
  totalValue: number;
}

export interface MarketCoordinationMetrics {
  totalMarkets: number;
  activeMarkets: number;
  totalParticipants: number;
  dailyVolume: number;
  dailyValue: number;
  averagePrice: number;
  priceVolatility: number;
  marketEfficiency: number;
  crossBorderTrades: number;
  integrationLevel: number;
}

@Injectable()
export class MarketCoordinationService {
  private readonly logger = new Logger(MarketCoordinationService.name);
  private markets: Map<string, EnergyMarket> = new Map();
  private bids: Map<string, MarketBid> = new Map();
  private transactions: Map<string, MarketTransaction> = new Map();
  private clearingResults: Map<string, MarketClearing> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeMarkets();
    this.startMarketCoordination();
  }

  private initializeMarkets(): void {
    const sampleMarkets: EnergyMarket[] = [
      {
        id: 'US_PJM_DA',
        name: 'PJM Day Ahead Market',
        region: 'Eastern US',
        countryCode: 'US',
        type: 'day_ahead',
        status: 'active',
        currency: 'USD',
        timezone: 'America/New_York',
        tradingHours: { open: '12:00', close: '14:00' },
        settlementPeriod: 60,
        minimumBidSize: 1,
        maximumBidSize: 1000,
        priceCap: 2000,
        priceFloor: -500,
        participants: 850,
        volume: 1200000, // 1.2 TWh daily
        lastUpdated: new Date(),
      },
      {
        id: 'EU_EPEX_DA',
        name: 'EPEX Spot Day Ahead',
        region: 'Central Europe',
        countryCode: 'DE',
        type: 'day_ahead',
        status: 'active',
        currency: 'EUR',
        timezone: 'Europe/Berlin',
        tradingHours: { open: '09:00', close: '12:00' },
        settlementPeriod: 60,
        minimumBidSize: 0.1,
        maximumBidSize: 500,
        priceCap: 3000,
        priceFloor: -500,
        participants: 450,
        volume: 800000, // 800 GWh daily
        lastUpdated: new Date(),
      },
      {
        id: 'CN_CEM_DA',
        name: 'China Electricity Market Day Ahead',
        region: 'Eastern China',
        countryCode: 'CN',
        type: 'day_ahead',
        status: 'active',
        currency: 'CNY',
        timezone: 'Asia/Shanghai',
        tradingHours: { open: '10:00', close: '11:30' },
        settlementPeriod: 60,
        minimumBidSize: 10,
        maximumBidSize: 2000,
        priceCap: 1500,
        priceFloor: 0,
        participants: 1200,
        volume: 2000000, // 2 TWh daily
        lastUpdated: new Date(),
      },
      {
        id: 'JP_JEPX_DA',
        name: 'Japan Electric Power Exchange Day Ahead',
        region: 'Japan',
        countryCode: 'JP',
        type: 'day_ahead',
        status: 'active',
        currency: 'JPY',
        timezone: 'Asia/Tokyo',
        tradingHours: { open: '09:00', close: '10:30' },
        settlementPeriod: 30,
        minimumBidSize: 0.5,
        maximumBidSize: 100,
        priceCap: 200,
        priceFloor: 0,
        participants: 180,
        volume: 150000, // 150 GWh daily
        lastUpdated: new Date(),
      },
      {
        id: 'AU_AEMO_DA',
        name: 'Australian Energy Market Day Ahead',
        region: 'Eastern Australia',
        countryCode: 'AU',
        type: 'day_ahead',
        status: 'active',
        currency: 'AUD',
        timezone: 'Australia/Sydney',
        tradingHours: { open: '04:00', close: '07:00' },
        settlementPeriod: 30,
        minimumBidSize: 1,
        maximumBidSize: 500,
        priceCap: 15000,
        priceFloor: -1000,
        participants: 120,
        volume: 600000, // 600 GWh daily
        lastUpdated: new Date(),
      },
    ];

    sampleMarkets.forEach(market => {
      this.markets.set(market.id, market);
    });

    this.logger.log(`Initialized ${sampleMarkets.length} energy markets`);
  }

  private startMarketCoordination(): void {
    // Start market clearing simulation
    setInterval(() => {
      this.runMarketClearing();
      this.optimizeCrossBorderTrading();
    }, 300000); // Every 5 minutes

    this.logger.log('Started international market coordination');
  }

  private runMarketClearing(): void {
    this.markets.forEach(market => {
      if (market.status === 'active') {
        this.clearMarket(market.id);
      }
    });
  }

  private clearMarket(marketId: string): void {
    const market = this.markets.get(marketId);
    if (!market) return;

    // Get bids for this market
    const marketBids = Array.from(this.bids.values())
      .filter(bid => bid.marketId === marketId && bid.status === 'submitted');

    if (marketBids.length === 0) return;

    // Separate supply and demand bids
    const supplyBids = marketBids.filter(bid => bid.type === 'supply').sort((a, b) => a.price - b.price);
    const demandBids = marketBids.filter(bid => bid.type === 'demand').sort((a, b) => b.price - a.price);

    // Build supply and demand curves
    const supplyCurve = this.buildSupplyCurve(supplyBids);
    const demandCurve = this.buildDemandCurve(demandBids);

    // Find clearing point
    const clearingResult = this.findClearingPoint(supplyCurve, demandCurve);

    // Execute transactions
    const transactions = this.executeTransactions(supplyBids, demandBids, clearingResult);

    // Create clearing result
    const clearing: MarketClearing = {
      id: `clearing_${marketId}_${Date.now()}`,
      marketId,
      clearingDate: new Date(),
      settlementPeriod: new Date(),
      supplyCurve,
      demandCurve,
      clearingPrice: clearingResult.price,
      clearingVolume: clearingResult.volume,
      surplus: clearingResult.surplus,
      congestionZones: [],
      executedTransactions: transactions.length,
      totalVolume: transactions.reduce((sum, tx) => sum + tx.volume, 0),
      totalValue: transactions.reduce((sum, tx) => sum + tx.value, 0),
    };

    this.clearingResults.set(clearing.id, clearing);
    this.logger.log(`Market clearing completed for ${marketId}: ${clearing.clearingPrice} USD/MWh, ${clearing.clearingVolume} MWh`);
  }

  private buildSupplyCurve(supplyBids: MarketBid[]): Array<{ price: number; volume: number }> {
    const curve = [];
    let cumulativeVolume = 0;

    supplyBids.forEach(bid => {
      curve.push({
        price: bid.price,
        volume: cumulativeVolume + bid.volume,
      });
      cumulativeVolume += bid.volume;
    });

    return curve;
  }

  private buildDemandCurve(demandBids: MarketBid[]): Array<{ price: number; volume: number }> {
    const curve = [];
    let cumulativeVolume = 0;

    demandBids.forEach(bid => {
      curve.push({
        price: bid.price,
        volume: cumulativeVolume + bid.volume,
      });
      cumulativeVolume += bid.volume;
    });

    return curve;
  }

  private findClearingPoint(
    supplyCurve: Array<{ price: number; volume: number }>,
    demandCurve: Array<{ price: number; volume: number }>
  ): { price: number; volume: number; surplus: number } {
    let price = 0;
    let volume = 0;
    let surplus = 0;

    // Find intersection point
    for (let i = 0; i < Math.min(supplyCurve.length, demandCurve.length); i++) {
      const supplyPoint = supplyCurve[i];
      const demandPoint = demandCurve[i];

      if (supplyPoint.price <= demandPoint.price) {
        price = (supplyPoint.price + demandPoint.price) / 2;
        volume = Math.min(supplyPoint.volume, demandPoint.volume);
        surplus = (demandPoint.price - supplyPoint.price) * volume;
      } else {
        break;
      }
    }

    return { price, volume, surplus };
  }

  private executeTransactions(
    supplyBids: MarketBid[],
    demandBids: MarketBid[],
    clearingResult: { price: number; volume: number; surplus: number }
  ): MarketTransaction[] {
    const transactions: MarketTransaction[] = [];
    let remainingVolume = clearingResult.volume;

    // Match supply and demand bids
    let supplyIndex = 0;
    let demandIndex = 0;

    while (remainingVolume > 0 && supplyIndex < supplyBids.length && demandIndex < demandBids.length) {
      const supplyBid = supplyBids[supplyIndex];
      const demandBid = demandBids[demandIndex];

      if (supplyBid.price <= clearingResult.price && demandBid.price >= clearingResult.price) {
        const transactionVolume = Math.min(
          remainingVolume,
          supplyBid.volume,
          demandBid.volume
        );

        const transaction: MarketTransaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          bidId: supplyBid.id,
          counterpartyBidId: demandBid.id,
          marketId: supplyBid.marketId,
          volume: transactionVolume,
          price: clearingResult.price,
          currency: supplyBid.currency,
          value: transactionVolume * clearingResult.price,
          executionTime: new Date(),
          deliveryPeriod: supplyBid.deliveryPeriod,
          status: 'executed',
          transactionCost: transactionVolume * 0.01, // 0.01 USD/MWh transaction cost
          clearingPrice: clearingResult.price,
        };

        transactions.push(transaction);
        this.transactions.set(transaction.id, transaction);

        // Update bid statuses
        supplyBid.status = 'filled';
        supplyBid.filledVolume = transactionVolume;
        supplyBid.averagePrice = clearingResult.price;

        demandBid.status = 'filled';
        demandBid.filledVolume = transactionVolume;
        demandBid.averagePrice = clearingResult.price;

        remainingVolume -= transactionVolume;

        // Move to next bids if current ones are fully filled
        if (supplyBid.volume <= transactionVolume) supplyIndex++;
        if (demandBid.volume <= transactionVolume) demandIndex++;
      } else {
        // Skip bids that don't match clearing price
        if (supplyBid.price > clearingResult.price) supplyIndex++;
        if (demandBid.price < clearingResult.price) demandIndex++;
      }
    }

    return transactions;
  }

  private optimizeCrossBorderTrading(): void {
    // Analyze cross-border arbitrage opportunities
    const activeMarkets = Array.from(this.markets.values())
      .filter(market => market.status === 'active');

    for (let i = 0; i < activeMarkets.length; i++) {
      for (let j = i + 1; j < activeMarkets.length; j++) {
        const market1 = activeMarkets[i];
        const market2 = activeMarkets[j];

        const arbitrageOpportunity = this.analyzeArbitrageOpportunity(market1, market2);
        if (arbitrageOpportunity.profitable) {
          this.logger.log(`Arbitrage opportunity found: ${market1.name} <-> ${market2.name}`);
        }
      }
    }
  }

  private analyzeArbitrageOpportunity(
    market1: EnergyMarket,
    market2: EnergyMarket
  ): { profitable: boolean; potentialProfit: number; volume: number } {
    // Get latest clearing prices
    const market1Price = this.getLatestClearingPrice(market1.id);
    const market2Price = this.getLatestClearingPrice(market2.id);

    if (!market1Price || !market2Price) {
      return { profitable: false, potentialProfit: 0, volume: 0 };
    }

    const priceDifference = Math.abs(market1Price - market2Price);
    const transmissionCost = this.estimateTransmissionCost(market1.countryCode, market2.countryCode);
    const netProfit = priceDifference - transmissionCost;

    const profitable = netProfit > 5; // Minimum $5/MWh profit
    const volume = Math.min(market1.volume, market2.volume) * 0.1; // 10% of volume
    const potentialProfit = netProfit * volume;

    return { profitable, potentialProfit, volume };
  }

  private getLatestClearingPrice(marketId: string): number | null {
    const clearings = Array.from(this.clearingResults.values())
      .filter(clearing => clearing.marketId === marketId)
      .sort((a, b) => b.clearingDate.getTime() - a.clearingDate.getTime());

    return clearings.length > 0 ? clearings[0].clearingPrice : null;
  }

  private estimateTransmissionCost(fromCountry: string, toCountry: string): number {
    // Simplified transmission cost estimation
    const baseCosts: Record<string, number> = {
      'US-CA': 8,
      'US-MX': 12,
      'EU-GB': 15,
      'CN-IN': 25,
      'JP-KR': 10,
      'AU-NZ': 20,
    };

    const key = `${fromCountry}-${toCountry}` || `${toCountry}-${fromCountry}`;
    return baseCosts[key] || 15; // Default $15/MWh
  }

  async getAllMarkets(): Promise<EnergyMarket[]> {
    return Array.from(this.markets.values());
  }

  async getMarketById(marketId: string): Promise<EnergyMarket | null> {
    return this.markets.get(marketId) || null;
  }

  async getMarketsByRegion(region: string): Promise<EnergyMarket[]> {
    return Array.from(this.markets.values()).filter(market => 
      market.region === region
    );
  }

  async getActiveMarkets(): Promise<EnergyMarket[]> {
    return Array.from(this.markets.values()).filter(market => 
      market.status === 'active'
    );
  }

  async submitBid(bidData: Partial<MarketBid>): Promise<MarketBid> {
    const bid: MarketBid = {
      id: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      marketId: bidData.marketId || '',
      participantId: bidData.participantId || '',
      type: bidData.type || 'supply',
      volume: bidData.volume || 0,
      price: bidData.price || 0,
      currency: bidData.currency || 'USD',
      duration: bidData.duration || 60,
      deliveryPeriod: bidData.deliveryPeriod || {
        start: new Date(),
        end: new Date(Date.now() + 60 * 60 * 1000),
      },
      status: 'submitted',
      priority: bidData.priority || 'economic',
      constraints: bidData.constraints || [],
      submittedAt: new Date(),
      ...bidData,
    };

    // Validate bid
    const market = this.markets.get(bid.marketId);
    if (market) {
      if (bid.volume < market.minimumBidSize || bid.volume > market.maximumBidSize) {
        throw new Error(`Bid volume must be between ${market.minimumBidSize} and ${market.maximumBidSize} MWh`);
      }
      if (bid.price < market.priceFloor || bid.price > market.priceCap) {
        throw new Error(`Bid price must be between ${market.priceFloor} and ${market.priceCap} USD/MWh`);
      }
    }

    this.bids.set(bid.id, bid);
    this.logger.log(`Submitted bid: ${bid.id} to market ${bid.marketId}`);
    return bid;
  }

  async getBidsByMarket(marketId: string): Promise<MarketBid[]> {
    return Array.from(this.bids.values()).filter(bid => 
      bid.marketId === marketId
    );
  }

  async getBidsByParticipant(participantId: string): Promise<MarketBid[]> {
    return Array.from(this.bids.values()).filter(bid => 
      bid.participantId === participantId
    );
  }

  async getTransactionsByMarket(marketId: string): Promise<MarketTransaction[]> {
    return Array.from(this.transactions.values()).filter(transaction => 
      transaction.marketId === marketId
    );
  }

  async getTransactionsByParticipant(participantId: string): Promise<MarketTransaction[]> {
    const participantBids = Array.from(this.bids.values())
      .filter(bid => bid.participantId === participantId)
      .map(bid => bid.id);

    return Array.from(this.transactions.values()).filter(transaction => 
      participantBids.includes(transaction.bidId) || 
      participantBids.includes(transaction.counterpartyBidId || '')
    );
  }

  async getMarketClearingHistory(
    marketId: string,
    limit: number = 10
  ): Promise<MarketClearing[]> {
    return Array.from(this.clearingResults.values())
      .filter(clearing => clearing.marketId === marketId)
      .sort((a, b) => b.clearingDate.getTime() - a.clearingDate.getTime())
      .slice(0, limit);
  }

  async getCoordinationMetrics(): Promise<MarketCoordinationMetrics> {
    const markets = Array.from(this.markets.values());
    const activeMarkets = markets.filter(market => market.status === 'active');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransactions = Array.from(this.transactions.values())
      .filter(tx => tx.executionTime >= today);

    const todayClearings = Array.from(this.clearingResults.values())
      .filter(clearing => clearing.clearingDate >= today);

    return {
      totalMarkets: markets.length,
      activeMarkets: activeMarkets.length,
      totalParticipants: markets.reduce((sum, market) => sum + market.participants, 0),
      dailyVolume: todayTransactions.reduce((sum, tx) => sum + tx.volume, 0),
      dailyValue: todayTransactions.reduce((sum, tx) => sum + tx.value, 0),
      averagePrice: todayClearings.length > 0 
        ? todayClearings.reduce((sum, clearing) => sum + clearing.clearingPrice, 0) / todayClearings.length 
        : 0,
      priceVolatility: this.calculatePriceVolatility(todayClearings),
      marketEfficiency: this.calculateMarketEfficiency(todayClearings),
      crossBorderTrades: this.countCrossBorderTrades(todayTransactions),
      integrationLevel: this.calculateIntegrationLevel(),
    };
  }

  private calculatePriceVolatility(clearings: MarketClearing[]): number {
    if (clearings.length < 2) return 0;

    const prices = clearings.map(c => c.clearingPrice);
    const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private calculateMarketEfficiency(clearings: MarketClearing[]): number {
    if (clearings.length === 0) return 0;

    const totalSurplus = clearings.reduce((sum, clearing) => sum + clearing.surplus, 0);
    const totalVolume = clearings.reduce((sum, clearing) => sum + clearing.clearingVolume, 0);
    
    return totalVolume > 0 ? totalSurplus / totalVolume : 0;
  }

  private countCrossBorderTrades(transactions: MarketTransaction[]): number {
    // Simplified cross-border trade counting
    return Math.floor(transactions.length * 0.15); // Assume 15% are cross-border
  }

  private calculateIntegrationLevel(): number {
    const markets = Array.from(this.markets.values()).filter(m => m.status === 'active');
    const regions = new Set(markets.map(m => m.region));
    
    return markets.length > 0 ? regions.size / markets.length : 0;
  }

  async enableCrossBorderTrading(
    marketId1: string,
    marketId2: string,
    capacity: number
  ): Promise<{ success: boolean; message: string }> {
    const market1 = this.markets.get(marketId1);
    const market2 = this.markets.get(marketId2);

    if (!market1 || !market2) {
      return { success: false, message: 'One or both markets not found' };
    }

    if (market1.status !== 'active' || market2.status !== 'active') {
      return { success: false, message: 'Both markets must be active' };
    }

    // Enable cross-border trading (simplified implementation)
    this.logger.log(`Enabled cross-border trading between ${market1.name} and ${market2.name} with capacity ${capacity} MW`);

    return { 
      success: true, 
      message: `Cross-border trading enabled with capacity ${capacity} MW` 
    };
  }

  async getMarketIntegrationStatus(): Promise<{
    integratedPairs: Array<{
      market1: string;
      market2: string;
      status: 'active' | 'pending' | 'inactive';
      capacity: number;
      utilization: number;
    }>;
    overallIntegration: number;
  }> {
    const activeMarkets = Array.from(this.markets.values()).filter(m => m.status === 'active');
    const integratedPairs = [];

    for (let i = 0; i < activeMarkets.length; i++) {
      for (let j = i + 1; j < activeMarkets.length; j++) {
        const market1 = activeMarkets[i];
        const market2 = activeMarkets[j];

        // Simulate integration status
        const isIntegrated = Math.random() > 0.6; // 40% chance of integration
        if (isIntegrated) {
          integratedPairs.push({
            market1: market1.name,
            market2: market2.name,
            status: 'active',
            capacity: Math.floor(Math.random() * 5000) + 1000,
            utilization: Math.random() * 0.8 + 0.1,
          });
        }
      }
    }

    const overallIntegration = activeMarkets.length > 1 
      ? integratedPairs.length / (activeMarkets.length * (activeMarkets.length - 1) / 2)
      : 0;

    return {
      integratedPairs,
      overallIntegration,
    };
  }
}
