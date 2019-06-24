App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },
  

  initContract: function() {
    // Load Lottery Contract
    $.getJSON('Lottery.json', function(lottery){
      App.contracts.Lottery = TruffleContract(lottery);
      App.contracts.Lottery.setProvider(App.web3Provider);
      return App.render();
    });
  },

  render: function(){
    var lotteryInstance;
    var loader = $("#loader");
    var content = $("#content");
    var useraccount;
    $('#candidates').html('');

    loader.show();
    content.hide();

    // Show User account address on page
    web3.eth.getCoinbase(function(err, account) {

      if (err === null) {
        App.account = account;
        useraccount = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // show the Lottery price on Page
    App.contracts.Lottery.deployed().then(function(instance) {
      lotteryInstance = instance;
      return lotteryInstance.SCBalance();
    }).then(function(balance){
      var etherValue = web3.fromWei(balance, 'ether');
      $('#LotteryPrice').html("Lottery Price: " + etherValue + " Ether");
      return lotteryInstance.manager();
    // Check that manager account enable Pickup Winner
    }).then(function(manager){

      if(manager != useraccount){
        $('#PickWinner').prop('disabled',true);
      } else {
        $('#PickWinner').prop('disabled',false);
      }
      return lotteryInstance.getPlayers();
    // Get All Players list And Check already join lottery or not
    }).then(function(players){
      if(players.includes(useraccount)){
        $('#EnterLottery').prop('disabled',true);
      } else {
        $('#EnterLottery').prop('disabled',false);
      }
      var i = 1;
      players.forEach(function (player) {
        var candidateTemplate = "<tr><th>" + i + "</th><td>" + player + "</td></tr>";
        $('#candidates').append(candidateTemplate);
        i++;
      });

      loader.hide();
      content.show();

    });
  },

  // EnterLottery button event
  EnterLottery:function(){
    var lotteryInstance;
    var txtaddress;
    App.contracts.Lottery.deployed().then(function(instance) {
      lotteryInstance = instance;
      txtaddress = lotteryInstance.enter({
        from: web3.eth.coinbase,
        value: 1000000000000000000
        
      }).then(function(data){
        return App.render();
      });
    }).then(function(data){
    });
  },
  
  // EnterLottery button event
  PickWinner:function(){
    var lotteryInstance;
    App.contracts.Lottery.deployed().then(function(instance) {
      lotteryInstance = instance;
      return lotteryInstance.pickWinner();
    }).then(function(data){
      console.log(data);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
