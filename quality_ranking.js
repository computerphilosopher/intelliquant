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

    //IQDate.addRebalSchedule(IQDate.setMonthlyStart(1));
    IQDate.addRebalSchedule(IQDate.setYearly(4, 1)); // 리밸런싱 주기를 매년 4월 1일로 설정
    IQDate.addRebalSchedule(IQDate.setYearly(6, 1)); // 리밸런싱 주기를 매년 6월 1일로 설정
    IQDate.addRebalSchedule(IQDate.setYearly(9, 1)); // 리밸런싱 주기를 매년 9월 1일로 설정
    IQDate.addRebalSchedule(IQDate.setYearly(12, 1)); // 리밸런싱 주기를 매년 12월 1일로 설정
    initCommonStock();
}

function getEarningGrowth(stock, years) {
    var add = years * 4;
    var prev = stock.getFundamentalNetProfit(add) + stock.getFundamentalNetProfit(1 + add) +
        stock.getFundamentalNetProfit(3 + add) + stock.getFundamentalNetProfit(4 + add);
    var cur = stock.getFundamentalNetProfit(0) + stock.getFundamentalNetProfit(1) +
        stock.getFundamentalNetProfit(2) + stock.getFundamentalNetProfit(3);
    
    var ret = (cur - prev) * 100 / prev;
    if (prev == 0 || isNaN(ret)) {
        return -1;
    }
    return ret;
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

function getFscore(stock) {
    var score = 0;
    
    var profit = stock.getFundamentalNetProfit(0) + stock.getFundamentalNetProfit(1) +
        stock.getFundamentalNetProfit(2) + stock.getFundamentalNetProfit(3);
    score += profit > 0;
    
    var cashflow = stock.getFundamentalOperatingCashFlow(0) + stock.getFundamentalOperatingCashFlow(1) + 
        stock.getFundamentalOperatingCashFlow(2) + stock.getFundamentalOperatingCashFlow(3);

    score += cashflow > 0;
    score += cashflow - profit > 0;
    
    var lastYearROA = (stock.getFundamentalNetProfit(4) + stock.getFundamentalNetProfit(5) + stock.getFundamentalNetProfit(6) 
    + stock.getFundamentalNetProfit(7)) / stock.getFundamentalTotalAsset(4); 
    
    score += stock.getROA() > lastYearROA;
    
    var cur_debt = (stock.getFundamentalTotalAsset(0) - stock.getFundamentalTotalEquity(0) 
                    - stock.getFundamentalTotalLiability(0)) / stock.getFundamentalTotalAsset(0);
    var last_debt = (stock.getFundamentalTotalAsset(4) - stock.getFundamentalTotalEquity(4) - 
                    stock.getFundamentalCurrentLiability(4)) / stock.getFundamentalTotalAsset(4);
    score += (cur_debt < last_debt);
    
    //유동비율
    var cur_ratio = stock.getFundamentalCurrentAsset(0) / stock.getFundamentalCurrentLiability(0);
    var last_ratio = stock.getFundamentalCurrentAsset(4) / stock.getFundamentalCurrentLiability(4);
    
    score += cur_ratio > last_ratio;
    
    score += stock.getNoOfShare(0) <= stock.getNoOfShare(252)
    
    score += stock.getFundamentalRevenue(0) - stock.getFundamentalSalesCost(0) > 
        stock.getFundamentalRevenue(4) - stock.getFundamentalSalesCost(4);
    
    score += stock.getFundamentalRevenue(0) / stock.getFundamentalTotalAsset(0) > 
        stock.getFundamentalRevenue(4) / stock.getFundamentalTotalAsset(4);
    
    return score;
}

// 3) 필터링 함수 정의 - 필터링 조건에 따라 종목들의 포함 여부 판단
function stockFilter(stock) {
    
    var filterChina = stock.code.substring(0, 2) != 'A9';
    var filterHoldings = !(stock.name.substr(stock.name.length-3)=="홀딩스" || stock.name.substr(stock.name.length-3) == "지주");
    var filterPER = (stock.getPER() > 0 && stock.getPER() < 30);
    var filterPBR = (stock.getPBR() > 0 && stock.getPBR() < 5);
    var filterPSR = getPSR(stock) < 1;
    var filterPCR = getPCR(stock) < 3;
    var filterLowEstimate = stock.getPER() * stock.getPBR() < 30;
    var filterROE = stock.getROE() >= stock.getPER();
    var filterNCAV = getNCAVFactor(stock) && getNCAVFactor(stock) >= 0.7; 
    var filterValue = filterPER && filterPBR;
    
    var filterDept = (stock.getFundamentalTotalLiability(0) * 100 / stock.getFundamentalTotalEquity(0)) < 150 || stock.sector == 'S022';
    var filterRatio = (stock.getFundamentalCurrentAsset(0) * 100 / stock.getFundamentalCurrentLiability(0)) > 150;
    var filterStock = stock.getNoOfShare(0) <= stock.getNoOfShare(8);
    //var filterQual = filterDept && filterRatio && filterStock;
    
    var filterDivYield = stock.getFundamentalDividend(0) > 0;
    var filterDivPay = 20 < stock.getDividendPayoutRatio() && stock.getDividendPayoutRatio()  < 80;
    var filterDiv = filterDivYield && filterDivPay;
    
    var filterAbsoluteMomentum = stock.getClose(252) > stock.getOpen();
    var filterMomentum = filterAbsoluteMomentum;
    
    return filterValue && filterChina && filterHoldings && filterStock;
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
    var sortedByGPA = universe.slice().sort(function(a,b){return getGPA(b)  - getGPA(a);}); // 수익성
    var sortedByNCAV = universe.slice().sort(function(a, b) {return getNCAVFactor(b) - getNCAVFactor(a);}); // valueation
    var sortedByGrowth = universe.slice().sort(function(a, b) { return getGrowthScore(b) - getGrowthScore(a) }) // 성장
    var sortedByFscore = universe.slice().sort(function(a,b){return getFscore(b)  - getFscore(a);}); // 성장 및 안정성
    universe.forEach(function(stock) {
      stock.setScore('rank_sum', sortedByGPA.indexOf(stock) + sortedByNCAV.indexOf(stock) + 
                     sortedByGrowth.indexOf(stock));
    });
 
  var factorRank = universe.slice().sort(function(a, b){return a.getScore('rank_sum')-b.getScore('rank_sum');});
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
            logger.info(_stock.code + '(' + _stock.name + '), 성장률:' + getRevenueGrowthRatio(_stock) + ' NCAV:' + getNCAVFactor(_stock));

        }

        isFirst = false;                 
    }
}

// 6) 시뮬레이션 종료 함수 - 시뮬레이션이 종료될 때 한번 자동으로 호출
function onComplete() {
    logger.debug("계좌 총 평가금액은 " + Math.floor(IQAccount.getDefaultAccount().getTotalEquity()) + "원 입니다.");
    IQLive.addPortfolio(stock_basket, stock_weight);
}