var stock_basket;               // 주식 종목들을 관리하는 Basket 객체
var stock_num = 30;             // 주식 종목 수
var stock_weight = 0.95;        // 주식 비중 (거래비용 고려 현금 5% 확보)

var isFirst = true;             // 시뮬레이션 시작일에 바로 포트폴리오 신규 구성을 하기 위해 사용될 상태 변수

var commonStockMap = new Object();
var nameCodeMap = new Object();
// 1) 시뮬레이션 초기화 함수 - 전략이 실행될 때 초기화를 위해 최초 한번 자동으로 실행

function initCommonStock() {

    var allStocks = IQStock.getAllStock();

}
function initialize() {
    stock_basket = new Basket(IQAccount.getDefaultAccount(), stock_num, IQEnvironment.aum * stock_weight);
    stock_basket.setPortfolioBuilder(stockPortfolioBuilder);

    IQDate.addRebalSchedule(IQDate.setMonthlyStart(1));
    initCommonStock();
}

// 주가순자산비율(PBR) 팩터 정의
function getPBR(stock) {
  // 해당 종목의 종가 또는 자본총계 값이 0인 경우에는 제외합니다.
  if (stock.getClose() === 0 || stock.getFundamentalTotalEquity() === 0) {
    return -1;
  }

  //stock.loadPrevData(0, 14, 0);   // 이전 분기 데이터가 필요할때만 사용합니다.

  // 주가순자산비율을 계산한 결과를 getPBR(stock) 함수를 호출한 곳으로 넘겨줍니다.
  return stock.getMarketCapital() / (stock.getFundamentalTotalEquity() * 4);
}

// 2) 팩터(factor) 지표 정의 - 종목 필터링 함수 및 포트폴리오 구성 함수에서 사용
// 주가수익비율(PER) 팩터 정의
function getPER(stock) {
    if (stock.getClose() === 0 || stock.getFundamentalNetProfit() === 0) {
        return -1;
    }

    return 1000 * stock.getMarketCapital() / (stock.getFundamentalNetProfit() * 4);
}

function getCommonStock(stock) {
    if (!(stock.name in commonStockMap)) {
        return stock
    }
    return commonStockMap[stock.code];
}

function getEarningGrowth(stock, years) {
    var prev = 4 * stock.getFundamentalNetProfit(4 * years)
    var cur = 4 * stock.getFundamentalNetProfit(0)
    return (cur - prev) * 100 / prev;
}

function getPEGR(stock) {
    return stock.getPER() / getEarningGrowth(stock, 3);
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

function DividendDeviation(stock, years){

    var min = Number.MAX_VALUE;
    var max = -1;

    for(var i=0; i<years; i++) {
        var d = stock.getFundamentalDividend(i * 4);
        if (!isFinite(d)) {
            logger.debug(d)
            break;
        }
        min = Math.min(min, d);
        max = Math.max(max, d);
    }
    if (min == 0) {
        return 100;
    }

    return ((max - min) / min) * 100;

}
function getPSR(stock) {
	if (stock.getClose(0) === 0 || stock.getFundamentalRevenue(0) === 0 ||stock.getNoOfShare(0) === 0 ) return -1;
    return  stock.getMarketCapital(0) / (stock.getFundamentalRevenue(0) + stock.getFundamentalRevenue(1) +
              stock.getFundamentalRevenue(2) + stock.getFundamentalRevenue(3));
}

function getPCR(stock) {
    if (stock.getFundamentalOperatingCashFlow(0) <= 0 ){
        return -1;
    }
    return stock.getMarketCapital(0) / stock.getFundamentalOperatingCashFlow(0);
}
function noDividendCut(stock, years) {

    var prev = -1

    for(var i=years; i>=0; i--) {
        var d = stock.getFundamentalDividend(i * 4);
        if (!isFinite(d)) {
            logger.debug(d)
            return false;
        }
        if (d < prev) {
            return false;
        }
        prev = d;
    }
    return true;
}

function getNCAVFactor(stock) {
    return ( (stock.getFundamentalCurrentAsset() * 1000)
            - (stock.getFundamentalTotalLiability() * 1000))
    / (stock.getMarketCapital() * 1000000);
}

function getDividendYieldPrefer(prefer) {
    var common = getCommonStock(prefer);
    if (common.getFundamentalDividend() == 0) {
        return 0;
    }
    var dps = common.getFundamentalDividend() * 1000 / common.getNoOfShare();
    if (prefer.name[prefer.name.length-1] == '우') {
    logger.debug(prefer.name + ' 배당금:' + common.getFundamentalDividend() + ' 총 주식수:' + common.getNoOfShare() + ' dps:' + dps + ' 배당률:' + (dps / prefer.getAdjOpen()) * 100);
}
return (dps / prefer.getAdjOpen()) * 100
}

// 3) 필터링 함수 정의 - 필터링 조건에 따라 종목들의 포함 여부 판단
function stockFilter(stock) {

    var filterChina = stock.code.substring(0, 2) != 'A9';
    var filterHoldings = !(stock.name.substr(stock.name.length-3)=="홀딩스" || stock.name.substr(stock.name.length-3) == "지주");
    var filterPER = (getPER(stock) > 0) && (getPER(stock) < 25);
    var filterPBR = (getPBR(stock) > 0) && (getPBR(stock) < 15);
    var filterPSR = getPSR(stock) < 1;
    var filterPCR = getPCR(stock) < 3;
    var filterLowEstimate = (getPER(stock) * getPBR(stock) < 30);
    var filterROE = stock.getROE() >= stock.getPER();
    var filterNCAV = getNCAVFactor(stock) && getNCAVFactor(stock) >= 0.4;

    var filterValue = filterPER && filterPBR && filterPSR &&
        filterPCR && filterLowEstimate && filterNCAV && filterROE;

    var filterDept = (stock.getFundamentalTotalLiability(0) * 100 / stock.getFundamentalTotalEquity(0)) < 150 || stock.sector == 'S022';
    var filterRatio = (stock.getFundamentalCurrentAsset(0) * 100 / stock.getFundamentalCurrentLiability(0)) > 150;
    var filterGPA = getGPA(stock) > 10;
    var filterQual = filterDept && filterRatio && filterGPA;

    var filterDivYield = stock.getFundamentalDividend(0) > 0;
    var filterDivPay = 20 < stock.getDividendPayoutRatio() && stock.getDividendPayoutRatio()  < 80;
    var filterDiv = filterDivYield && filterDivPay;

    var filterAbsoluteMomentum = stock.getClose(252) > stock.getOpen();
    var filterMomentum = filterAbsoluteMomentum;

    return filterValue && filterQual && filterDiv&& filterChina && filterHoldings;
}


// 4) 포트폴리오 빌더 함수 정의 - 필터링 및 팩터 기반 종목 선정
function stockPortfolioBuilder(targetSize) {
    var universe = IQStock.filter(stockFilter);

    var sortedByDivRatio = universe.slice().sort(function(a,b){return b.getDividendYieldRatio()  - a.getDividendYieldRatio();});

    return sortedByDivRatio.slice(0, targetSize);

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
            logger.info(_stock.code + '(' + _stock.name + '), 배당:' + _stock.getDividendYieldRatio() + ' NCAV:' + getNCAVFactor(_stock));

        }

        isFirst = false;
    }
}

// 6) 시뮬레이션 종료 함수 - 시뮬레이션이 종료될 때 한번 자동으로 호출
function onComplete() {
    logger.debug("계좌 총 평가금액은 " + Math.floor(IQAccount.getDefaultAccount().getTotalEquity()) + "원 입니다.");
    IQLive.addPortfolio(stock_basket, stock_weight);
}
