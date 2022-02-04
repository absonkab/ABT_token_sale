App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    tokAddress: '0x0',
    loading: false,
    web3Connect: false,
    tokenPrice: 0,
    tokensSold: 0,
    totalSupply: 0,
    decimals: 0,
    name: "",
    symbol: "",

    init: function() {
        console.log("App initialized...")
        return App.initWeb3();
    },

    initWeb3: function() {
        if (typeof web3 !== 'undefined') {
            // If a web3 instance is already provided by Meta Mask.
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContracts();
    },

    initContracts: function() {
        $.getJSON("ABSCrowdsale.json", function(abscrowdsale) {
            //App.contracts.ABSCrowdsale = require("@truffle/contract");
            //import App.contracts.ABSCrowdsale from '@truffle/contract';
            // var MyContract = contract({
            //     abi: ...,
            //     unlinked_binary: ...,
            //     address: ..., // optional
            //     // many more
            // })
            // MyContract.setProvider(provider);
            App.contracts.ABSCrowdsale = TruffleContract(abscrowdsale);
            App.contracts.ABSCrowdsale.setProvider(App.web3Provider);
            App.contracts.ABSCrowdsale.deployed().then(function(abscrowdsale) {
                console.log("Abs Token Sale Address:", abscrowdsale.address);
            });
        }).done(function() {
            $.getJSON("ABSToken.json", function(absToken) {
                App.contracts.ABSToken = TruffleContract(absToken);
                App.contracts.ABSToken.setProvider(App.web3Provider);
                App.contracts.ABSToken.deployed().then(function(absToken) {
                    console.log("Abs Token Address:", absToken.address);
                });

                App.listenForEvents();
                return App.render();
            });
        })
    },

    // Listen for events emitted from the contract
    listenForEvents: function() {
        App.contracts.ABSCrowdsale.deployed().then(function(instance) {
            instance.TokensPurchased({}, {
                    fromBlock: 0,
                    toBlock: 'latest',
                }),
                function(error, event) {
                    console.log("event triggered", event);
                    App.render();
                }
        })
    },

    render: function() {
        if (App.loading) {
            return;
        }
        App.loading = true;

        var loader = $('#loader');
        var loader2 = $('#loader2');
        var loader3 = $('#loader3');
        var content = $('#content');

        loader.show();
        loader2.hide();
        loader3.hide();
        content.hide();

        // Load account data
        web3.eth.getCoinbase(function(err, account) {
            if (err === null) {
                App.account = account;
                $('#accountAddress').html("L'adresse de votre wallet: " + account);
            }
        })

        // Load token sale contract
        App.contracts.ABSCrowdsale.deployed().then(function(instance) {
            abscrowdsaleInstance = instance;
            return abscrowdsaleInstance.rate();
        }).then(function(rate) {
            App.tokenPrice = rate;
            $('.token-price').html(web3.utils.fromWei(App.tokenPrice, "ether"));
            return abscrowdsaleInstance.weiRaised();
        }).then(function(weiRaised) {
            weiRaised = parseInt(weiRaised.toString());
            console.log("weiRaised: ", weiRaised);
            //weiRaised = weiRaised.toNumber();
            let tksold = weiRaised * App.tokenPrice * Math.pow(10, -App.decimals);
            //App.tokensSold = tksold;
            console.log("token sold: ", tksold);
            console.log("weiRaised: ", weiRaised);
            //$('.tokens-sold').html(App.tokensSold);
            $('.tokens-available').html(App.tokensAvailable);

            var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
            $('#progress').css('width', progressPercent + '%');

            // Load token contract
            App.contracts.ABSToken.deployed().then(function(instance) {
                absTokenInstance = instance;
                //$('#tokenAddress').html("Adresse du token ABST: " + absTokenInstance.address);
                App.tokAddress = absTokenInstance.address;
                return absTokenInstance.name();
            }).then(function(name) {
                App.name = name;
                $('.abs-name').html(App.name);
                console.log("name: ", name);
                return absTokenInstance.symbol();
            }).then(function(symbol) {
                App.symbol = symbol;
                $('.abs-symbol').html(App.symbol);
                $('#tokenAddress').html("Adresse du token " + App.symbol + ": " + App.tokAddress);
                console.log("symbol: ", symbol);
                return absTokenInstance.decimals();
            }).then(function(decimals) {
                App.decimals = decimals.toNumber();
                App.tokensSold = parseInt(App.noExponents(weiRaised * App.tokenPrice * Math.pow(10, -App.decimals)));
                //App.tokensSold = App.convertExpToDec(weiRaised*App.tokenPrice*Math.pow(10, -App.decimals));
                $('.tokens-sold').html(App.tokensSold);
                console.log("decimals: ", decimals);
                console.log("tokensSold: ", weiRaised * App.tokenPrice * Math.pow(10, -App.decimals));
                return absTokenInstance.totalSupply();
            }).then(function(totalSupply) {
                totalSupply = parseInt(totalSupply.toString());
                App.totalSupply = parseInt(App.noExponents(totalSupply * Math.pow(10, -App.decimals)));
                $('.abs-totalSupply').html(App.totalSupply);
                console.log("totalSupply: ", App.totalSupply);
                return absTokenInstance.balanceOf(App.account);
            }).then(function(balance) {
                balance = parseInt(balance.toString());
                //balance = balance.toNumber();
                balance = App.noExponents(balance / 10 ** App.decimals);
                console.log("balance: ", balance);
                $('.abs-balance').html(balance);
                App.loading = false;
                loader.hide();
                loader2.hide();
                loader3.hide();
                content.show();
            }).catch(e => {
                if (!App.web3Connect) {
                    window.alert("Aucun Metamask Connecté. Ce site est un site d'achat de jetons - pour continuer, vous devez connecter votre wallet Metamask à ce site");
                    App.web3Connect = true;
                    $('#loader').hide();
                    $('#loader3').show();
                } else {
                    $('#loader3').show();
                    $('#content').hide();
                    $('#loader').hide();
                    $('#loader2').hide();
                }

            })
        });
    },

    buyTokens: function() {
        $('#content').hide();
        $('#loader').hide();
        $('#loader3').hide();
        $('#loader2').show();
        var numberOfTokens = $('#numberOfTokens').val();
        console.log("Amount of Tokens bought...", numberOfTokens)
        numberOfTokens = Number(numberOfTokens);
        console.log("Amount of Tokens bought converted in type number...", numberOfTokens)
        var numberOfWeis = numberOfTokens / (App.tokenPrice * Math.pow(10, -App.decimals));
        numberOfWeis = App.noExponents(numberOfWeis);
        console.log("nombre de wei correspondant ", numberOfWeis);
        console.log("valeur en BNB correspondant ", numberOfWeis * Math.pow(10, -App.decimals));
        App.contracts.ABSCrowdsale.deployed().then(function(instance) {
                return instance.buyTokens(App.account, {
                    value: numberOfWeis,
                    from: App.account
                });
            }).then(function(result) {
                console.log("Tokens bought...", numberOfTokens)
                $('form').trigger('reset') // reset number of tokens in form
                location.reload();
                // Wait for Sell event
            }).catch(e => {
                if (e.code === 4001) {
                    //user rejected the transaction
                    alert("Vous avez rejeté la transaction");
                    location.reload();
                }
            })
            /*.catch(function (e) {
                        // Transaction rejected or failed
                        console.log(e);
                        alert("Vous avez rejeté la transaction");
                        location.reload();
                    })*/
        ;
    },

    convertExpToDec: function(n) {
        var [lead, decimal, pow] = n.toString().split(/e|\./);
        console.log(lead, decimal, pow);
        return +pow <= 0 ?
            "0." + "0".repeat(Math.abs(pow) - 1) + lead + decimal :
            lead + (+pow >= decimal.length ? (decimal + "0".repeat(+pow - decimal.length)) : (decimal.slice(0, +pow) + "." + decimal.slice(+pow)))
    },

    noExponents: function(nb) {
        var data = String(nb).split(/[eE]/);
        if (data.length == 1) return data[0];

        var z = '',
            sign = nb < 0 ? '-' : '',
            str = data[0].replace('.', ''),
            mag = Number(data[1]) + 1;

        if (mag < 0) {
            z = sign + '0.';
            while (mag++) z += '0';
            return z + str.replace(/^\-/, '');
        }
        mag -= str.length;
        while (mag--) z += '0';
        return str + z;
    }
}

$(function() {
    $(window).load(function() {
        App.init();
    })
});