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

    //IQDate.addRebalSchedule(IQDate.setMonthlyStart(1));
        IQDate.addRebalSchedule(IQDate.setYearly(4, 1)); // 리밸런싱 주기를 매년 4월 1일로 설정
    IQDate.addRebalSchedule(IQDate.setYearly(6, 1)); // 리밸런싱 주기를 매년 6월 1일로 설정
    IQDate.addRebalSchedule(IQDate.setYearly(9, 1)); // 리밸런싱 주기를 매년 9월 1일로 설정
    IQDate.addRebalSchedule(IQDate.setYearly(12, 1)); // 리밸런싱 주기를 매년 12월 1일로 설정
}


function getGPA(stock) {
  if (stock.getFundamentalRevenue() === 0 || stock.getFundamentalSalesCost() === 0 || stock.getFundamentalTotalAsset() === 0 ) return -1;
	stock.loadPrevData(0, 14, 0);
  return 100 * (stock.getFundamentalRevenue(0) +
          stock.getFundamentalRevenue(1) +
          stock.getFundamentalRevenue(2) +
          stock.getFundamentalRevenue(3) -
          stock.getFundamentalSalesCost(0) -
          stock.getFundamentalSalesCost(1) -
          stock.getFundamentalSalesCost(2) -
          stock.getFundamentalSalesCost(3) ) / stock.getFundamentalTotalAsset();}

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

    return filterPER;
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
    var sortedByGrowth = universe.slice().sort(function(a,b){return getGrowthScore(b) - getGrowthScore(a);});
    var sortedByGPA = universe.slice().sort(function(a,b){return getGPA(b)  - getGPA(a);});

    universe.forEach(function(stock) {
      stock.setScore('quality', sortedByGPA.indexOf(stock) + sortedByGrowth.indexOf(stock));
    });

    var qualityRank = universe.slice().sort(function(a, b){return a.getScore('quality')-b.getScore('quality');});

    var qualityUniverse = qualityRank.slice(0, Math.floor(universe.length * 0.1));

    var sortedByPBR = qualityUniverse.slice().sort(function(a, b) {return a.getPBR() - b.getPBR();}); // valueation
    var sortedByPER = qualityUniverse.slice().sort(function(a, b) {return a.getPER() - b.getPER();}); // valueation

    qualityUniverse.forEach(function(stock) {
      stock.setScore('rank_sum', sortedByPBR.indexOf(stock) + sortedByPER.indexOf(stock));
    });

    var factorRank = qualityUniverse.slice().sort(function(a, b){return a.getScore('rank_sum')-b.getScore('rank_sum');});

    return factorRank.slice(0, targetSize);
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
            logger.info(_stock.code + '(' + _stock.name + '), 배당:' + _stock.getDividendYieldRatio());
        }

        isFirst = false;
    }
}

// 6) 시뮬레이션 종료 함수 - 시뮬레이션이 종료될 때 한번 자동으로 호출
function onComplete() {
    logger.debug("계좌 총 평가금액은 " + Math.floor(IQAccount.getDefaultAccount().getTotalEquity()) + "원 입니다.");
    IQLive.addPortfolio(stock_basket, stock_weight);
}
