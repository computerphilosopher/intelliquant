/**
이 코드는 인텔리퀀트 스튜디오 사용법을 설명하기 위한 예제입니다.
인텔리퀀트는 이 알고리즘의 수익률을 보장하지 않습니다.
그러나 정량적인 가설 -> 검증(시뮬레이션) -> 실증 과정을 통해
여러분이 보다 안정적인 높은 수익률을 낼 수 있을거라 확신합니다.
**/

var stock_basket;               // 주식 종목들을 관리하는 Basket 객체
var stock_num = 30;             // 주식 종목 수
var stock_weight = 0.95;        // 주식 비중 (거래비용 고려 현금 5% 확보)

var isFirst = true;             // 시뮬레이션 시작일에 바로 포트폴리오 신규 구성을 하기 위해 사용될 상태 변수


// 1) 시뮬레이션 초기화 함수 - 전략이 실행될 때 초기화를 위해 최초 한번 자동으로 실행
function initialize() {
    stock_basket = new Basket(IQAccount.getDefaultAccount(), stock_num, IQEnvironment.aum * stock_weight);
    stock_basket.setPortfolioBuilder(stockPortfolioBuilder);

    IQDate.addRebalSchedule(IQDate.setYearly(1, 1));
}

// 2) 팩터(factor) 지표 정의 - 종목 필터링 함수 및 포트폴리오 구성 함수에서 사용
// 주가수익비율(PER) 팩터 정의
function getPER(stock) {
    if (stock.getClose() === 0 || stock.getFundamentalNetProfit() === 0) {
        return -1;
    }
    
    return 1000 * stock.getMarketCapital() / (stock.getFundamentalNetProfit() * 4);
}

// 3) 필터링 함수 정의 - 필터링 조건에 따라 종목들의 포함 여부 판단
function stockFilter(stock) {
    if (stock.isETF) {
        return false;
    }

    var filterMarketCapital = (stock.getMarketCapital() > 50000);   
    var filterTradingValue = (stock.getTradingValue() > 100);     
    var filterPER = (getPER(stock) > 0);                          
    var filterChina = stock.code.substring(0, 2) != 'A9';
    var filterHoldings = !(stock.name.substr(stock.name.length-3)=="홀딩스" || stock.name.substr(stock.name.length-3) == "지주");
    //return (filterMarketCapital &&  filterTradingValue && filterPER);
    return filterChina && filterHoldings;
}

function getRevenueGrowthRatio(stock) {
	stock.loadPrevData(2, 0, 0)
    try {
        var revenueGrowthRatioTotal = 1;
        var revenueGrowthRatioStrike = 0;
        
        var prevRevenue = stock.getFundamentalRevenue(8);
        
        for (var i = 7; i >= 0; i--) {
            var revenue = stock.getFundamentalRevenue(i);
            var revenueGrowthRatio = revenue / prevRevenue;
            
            /*
            if (revenueGrowthRatio < 1) {
                revenueGrowthRatioStrike++;
                if (revenueGrowthRatioStrike == 4)
                    return 0;
            }
            */
            revenueGrowthRatioTotal *= revenueGrowthRatio;
          	prevRevenue = revenue;  
        }
        return revenueGrowthRatioTotal;
    } catch(e) {
        logger.debug(e); 
    }
}
function getEarningGrowth(stock, years) {
    var add = years * 4;
    var prev = stock.getFundamentalNetProfit(add) + stock.getFundamentalNetProfit(1 + add) +
        stock.getFundamentalNetProfit(3 + add) + stock.getFundamentalNetProfit(4 + add);
    var cur = stock.getFundamentalNetProfit(0) + stock.getFundamentalNetProfit(1) +
        stock.getFundamentalNetProfit(2) + stock.getFundamentalNetProfit(3);
    
    var ret = cur - prev / Math.abs(prev);
    return ret;
}


function getGPA(stock, year) {
  if (stock.getFundamentalRevenue() === 0 || stock.getFundamentalSalesCost() === 0 || stock.getFundamentalTotalAsset() === 0 ) return -1;	
	//stock.loadPrevData(0, 14, 0);
  var add = 4 * year
  return 100 * (stock.getFundamentalRevenue(0 + add) + 
          stock.getFundamentalRevenue(1 + add) + 
          stock.getFundamentalRevenue(2 + add) + 
          stock.getFundamentalRevenue(3 + add) - 
          stock.getFundamentalSalesCost(0 + add) - 
          stock.getFundamentalSalesCost(1 + add) - 
          stock.getFundamentalSalesCost(2 + add) - 
          stock.getFundamentalSalesCost(3 + add) ) / stock.getFundamentalTotalAsset();
}

function getGrowthScore(stock) {
    var score = 0;
    
    var curGP = (stock.getFundamentalRevenue(0) + 
          stock.getFundamentalRevenue(1) + 
          stock.getFundamentalRevenue(2) + 
          stock.getFundamentalRevenue(3) - 
          stock.getFundamentalSalesCost(0) - 
          stock.getFundamentalSalesCost(1) - 
          stock.getFundamentalSalesCost(2) - 
          stock.getFundamentalSalesCost(3));
    var prevGP = (stock.getFundamentalRevenue(4) + 
          stock.getFundamentalRevenue(5) + 
          stock.getFundamentalRevenue(6) + 
          stock.getFundamentalRevenue(7) - 
          stock.getFundamentalSalesCost(4) - 
          stock.getFundamentalSalesCost(5) - 
          stock.getFundamentalSalesCost(6) - 
          stock.getFundamentalSalesCost(7));
    score += curGP > prevGP;
    
    var curProfit = stock.getFundamentalNetProfit(0) + stock.getFundamentalNetProfit(1) +
        stock.getFundamentalNetProfit(2) + stock.getFundamentalNetProfit(3);
    var prevProfit =  stock.getFundamentalNetProfit(4) + stock.getFundamentalNetProfit(5) +
        stock.getFundamentalNetProfit(6) + stock.getFundamentalNetProfit(7);
    //score += curProfit > prevProfit;
    
    var curCashFlow = stock.getFundamentalOperatingCashFlow(0) + stock.getFundamentalOperatingCashFlow(1) + 
        stock.getFundamentalOperatingCashFlow(2) + stock.getFundamentalOperatingCashFlow(3);
    var prevCashFlow = stock.getFundamentalOperatingCashFlow(4) + stock.getFundamentalOperatingCashFlow(5) + 
        stock.getFundamentalOperatingCashFlow(6) + stock.getFundamentalOperatingCashFlow(7);
    score += curCashFlow > prevCashFlow; 
    
    //score += stock.getFundamentalTotalLiability(0) < stock.getFundamentalTotalLiability(4);
    //score += stock.getFundamentalInventoryAsset(0) < stock.getFundamentalInventoryAsset(4);
    //유동비율
    score += (stock.getFundamentalCurrentAsset(0) / stock.getFundamentalCurrentLiability(0)) >
        (stock.getFundamentalCurrentAsset(4) / stock.getFundamentalCurrentLiability(4));
    //자산 회전율
    score += (stock.getFundamentalRevenue(0) / stock.getFundamentalTotalAsset(0)) >
        stock.getFundamentalRevenue(4) / stock.getFundamentalTotalAsset(4);
    score += (stock.getFundamentalRevenue(0) / stock.getFundamentalInventoryAsset(0)) >
        stock.getFundamentalRevenue(4) / stock.getFundamentalInventoryAsset(4);
    
    score += stock.getNoOfShare(0) < stock.getNoOfShare(4);
    
    score += stock.getFundamentalDividend(0) > stock.getFundamentalDividend(4);
    
    return score;

}

// 4) 포트폴리오 빌더 함수 정의 - 필터링 및 팩터 기반 종목 선정
function stockPortfolioBuilder(targetSize) {
    var universe = IQStock.filter(stockFilter);
    //var sortedByGrowth = universe.slice().sort(function(a,b){return getEarningGrowth(b, 3) - getEarningGrowth(a, 3);}); 
    var sortedByGrowth = universe.slice().sort(function(a,b){return getGrowthScore(b) - getGrowthScore(a);}); 
    return sortedByGrowth.slice(0, targetSize);  
}

// 5) 리밸런싱 수행 - 시뮬레이션 기간 동안 장 마감 후 매일 자동으로 호출되는 함수
function onDayClose(now) {
    if (IQDate.isRebalancingDay(now) || isFirst === true) {
        logger.debug('리밸런싱을 진행합니다!');

        var currentTotalEquity = IQAccount.getDefaultAccount().getTotalEquity();
        logger.debug('현재 계좌 평가액 : ' + Math.floor(currentTotalEquity));
 
        stock_basket.setBudget(currentTotalEquity * stock_weight);

        stock_basket.buildPortfolio();
        var eggs = stock_basket.newEggs.values();
        for(var i=0; i <eggs.length; i++) {
            var _stock = eggs[i].stock;
            logger.info(_stock.code + '(' + _stock.name + '), 성장률:'  + getRevenueGrowthRatio(_stock));

        }

        isFirst = false;                 
    }
}

// 6) 시뮬레이션 종료 함수 - 시뮬레이션이 종료될 때 한번 자동으로 호출
function onComplete() {
    logger.debug("계좌 총 평가금액은 " + Math.floor(IQAccount.getDefaultAccount().getTotalEquity()) + "원 입니다.");
    IQLive.addPortfolio(stock_basket, stock_weight);
}