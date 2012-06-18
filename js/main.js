// config attributes
var CONFIG = {
  'ingredients': ['sauce', 'cheese', 'salami', 'onion', 'chilli', 'olive', 'tomato', 'mushroom', 'pepper'],
  'scoring': {
    'level_up': 250, // completed the level
    'perfect': 350, // completed the level with no errors
    'time_left': 7, // time_left bonus per second
    'pizza': 70, // after successful pizza
    'superb': 30, // superb! bonus per pizza, for each time queue is emptied early
    'superb_3': 100 // more than 3 superbs in a level! lump bonus
  },
  'levels': [
    // game levels for quick testing
    //{'full': 2, 'half': 0, 'orders': 4, 'order_time': 8, 'extra_time': 20},
    //{'full': 3, 'half': 2, 'orders': 4, 'order_time': 8, 'extra_time': 20},
    
    // game levels - 7 level set
    {'full': 2, 'half': 0, 'orders': 10, 'order_time': 12, 'extra_time': 20},
    {'full': 3, 'half': 0, 'orders': 10, 'order_time': 12, 'extra_time': 20},
    {'full': 3, 'half': 2, 'orders': 12, 'order_time': 14, 'extra_time': 30},
    {'full': 4, 'half': 2, 'orders': 12, 'order_time': 16, 'extra_time': 30},
    {'full': 4, 'half': 2, 'orders': 15, 'order_time': 12, 'extra_time': 40},
    {'full': 4, 'half': 4, 'orders': 15, 'order_time': 14, 'extra_time': 40},
    {'full': 4, 'half': 4, 'orders': 20, 'order_time': 10, 'extra_time': 50},
    
  ],
};

// messages
var MSG = {
  // short alerts are prefixed with an underscore
  '_pizza_fail': 'Wrong Ingredient!',
  '_pizza_success': 'Yummy!',
  '_superb': 'Superb!',
  
};

var X = {
  'level': {}, // current level attributes
  'level_id': 0, // current level
  
  'orders_queue': [], // orders queue
  'orders_level': 0, // orders left from this level
  'order': {}, // current order
  
  'pizza': {}, // current pizza's ingredients
  
  'interval': null, // track setInteval id
  'time_total': 0, // total play time
  'time_play': 0, // time for each play
  'time_queue': 0, // time for queue
  'time_left': 0, // time left
  
  'score': 0, // score of this player
  'errors': 0, // error in this level
  'max_errors': 3, // number of errors allowed
  'superb': 0, // to track for each time queue is emptied
};

function startGame(run) {
  $('#pizza on').removeClass('on');
  $('#msg').css({y: 200, opacity: 0});
  startLevel(0, run);
}

function pauseGame() {
  clearInterval(X.interval);
}

function resumeGame() {
  clearInterval(X.interval);
  X.interval = setInterval(runTimer, 1000);
}

function failGame() {
  clearInterval(X.interval);
  
  // animate - load game over board
  
  $('#gameover-board').fadeIn('fast');
  startLevel(0, false);
  console.log('failGame');
}

function startLevel(level, run) {
  X.level = CONFIG.levels[level];
  X.level_id = level;
  
  X.orders_queue = [];
  X.orders_level = X.level.orders;
  X.order = {};
  
  X.pizza = {};
  X.time_total = 0;
  X.time_play = 0;
  X.time_queue = 0;
  X.time_total = X.level.extra_time + (X.level.order_time * X.orders_level);
  X.time_left = X.time_total;
  
  if(level == 0) X.score = 0; // reset score only if level is back to 0
  X.errors = 0; 
  X.superb = 0; 
  
  addOrder(); // add first order
  startOrder(); // start with the first order
  
  // animate - load level board
  
  if(run) X.interval = setInterval(runTimer, 1000); // set timer for the next orders
  
  $('#level').html(X.level_id + 1);
  $('#score').html(X.score);
  $('#order-notes').html('');
  $('#time-left .bar').width('100%');
}

function endLevel() {
  
  // check if all orders are completed
  if(X.orders_queue.length || X.orders_level) {
    failGame();
  } else {
    pauseGame();
    
    // animate - load score board
    $('#score-board #scores').html('');
    $('#score-board #nextlevel-text').html(X.level_id+2);
    $('#score-board').fadeIn('fast');
    
    // add up scores
    $('#score-board #scores').append('Level up bonus: '+ addScore('level_up'));
    $('#score-board #scores').append('<br />Extra time bonus: '+ addScore('time_left'));
    $('#score-board #scores').append('<br />Superb bonus: '+ addScore('superb'));
    if(!X.errors) $('#score-board #scores').append('<br />Perfect bonus: '+ addScore('perfect'));

    //alert('Level '+ X.level_id+2);
    //startLevel(X.level_id+1, true);
  }
  
  console.log('endLevel');
}

function runTimer() {
  //$('#time_left .text').html(X.time_left);
  $('#time-left .bar').width(X.time_left / X.time_total * 100 +'%');
  
  if(X.orders_level) $('#next-order .bar').width( 100 - (X.time_queue / X.level.order_time * 100) +'%');
  else $('#next-order .bar').width('0%');
  
  // orders left and timer is up
  if(X.orders_level && X.time_queue == X.level.order_time) addOrder();
  
  // no orders left, and no time left
  if(!X.orders_level && !X.time_left) endLevel();

  X.time_queue++;
  X.time_play++;
  X.time_total++;
  X.time_left--;
}

function addScore(what) {
  var _extra = CONFIG.scoring[what];
  
  if(what == 'time_left') {
    _extra = X.time_left * CONFIG.scoring[what];
  }
  
  if(what == 'superb_3' && X.superb >= 3) {
    showMessage(MSG['_superb']);
    _extra = CONFIG.scoring[what];
  }
  
  X.score += _extra;
  
  console.log('addScore: '+ _extra +' for: '+ what);
  console.log(X.score);
  
  $('#score').html(X.score);
  return _extra;
}

function addOrder() {
  // add order to the X.order queue
  X.orders_queue.push(createRecipe());
  X.time_queue = 0;
  X.orders_level--;
  
  // animate - load order
  
  console.log('addOrder');
  queueOrderNote(true); // in
  $('#orders').html(X.orders_queue.length - 1);
  $('#o').html(X.orders_level);
}

function startOrder() {
  
  console.log('in queue: '+ X.orders_queue.length +', from level: '+ X.orders_level);
  
  if(!X.orders_queue.length && X.orders_level) { // create order on-the-fly when queue is emptied
    X.superb++;
    addScore('superb')
    addOrder();
  }
  
  X.pizza = {'_left': [], '_right': []};
  X.order = X.orders_queue[0].full.concat(X.orders_queue[0].full.concat(X.orders_queue[0].half));
  
  // if no more order
  if(!X.orders_queue.length && !X.orders_level) nextLevel();
  
  // animate - load base Pizza into the gameboard
  $('#pizza').css({x: 0, y: -500});
  $('#pizza').transition({ y: 0}, 500, 'ease', function() {
    
  });
  
  console.log('startOrder');
  $('#errors').html(X.errors);
  
  doOrderNote();
  $('#order').html('- '+ X.order.join('<br /> - '));
}

function queueOrderNote(_in) {  
  if(X.orders_queue.length - 1 > 0) {
    $('#order-notes').html(X.orders_queue.length - 1);
    
    // in effect
    if(_in) $('#order-notes-show').css({x: 140, opacity: 0}).transition({x: 0, opacity: 0.7}, function() {
      $('#order-notes').css({opacity: 1});
    });
    // out effect
    else $('#order-notes-show').css({x: 0, opacity: 0.7}).transition({x: 140, opacity: 0}, function() {
      
    });
  } else {
    $('#order-notes').css({opacity: 0.2});
    $('#order-notes-show').css({opacity: 0});
  }
}

function doOrderNote() {
  var order_note = '';
  for(i in X.orders_queue[0]['full'])
    order_note += '<div class="'+ X.orders_queue[0]['full'][i] +' full">'+ X.orders_queue[0]['full'][i] +'</div>';
   
  for(i in X.orders_queue[0]['half'])
    order_note += '<div class="'+ X.orders_queue[0]['half'][i] +' half">'+ X.orders_queue[0]['half'][i] +' 1/2</div>';
     
  $('#order-note').html(order_note);
  $('#order-note').transition({ x: 90, opacity: 0}, 200, function() {
    $(this).css('x', -90)
    $(this).transition({ x: 0, opacity: 1}, 400);
  });
}

function doOrder(success) {

  //$('#order').html('- '+ X.order.join('<br />'));
  //$('#order_note').html('- '+ X.order.join('<br />'));
  
  if(success) {
    console.log('doOrder - success');
    showMessage(MSG['_pizza_success']);
    
    X.orders_queue.splice(0, 1);
    queueOrderNote(false); // out
    addScore('pizza');
    
  } else {
    console.log('doOrder - fail');
    showMessage(MSG['_pizza_fail']);
    
    X.errors++;
    if(X.errors >= X.max_errors) failGame(); // failGame - Game Over!
    X.time_left += X.time_play;
  }
  
  X.time_play = 0;
  
  // animate - load Pizza out of the gameboard
  $('#pizza').transition({ x: 500, delay: 100 }, 400, 'ease', function() {
    $('#pizza .on').removeClass('on');
    
    if(!X.orders_queue.length && !X.orders_level) endLevel(); // no more orders in this level
    else startOrder(); // work on next 
  });
  
  $('#orders').html(X.orders_queue.length - 1);
}

function createRecipe() {
  var _ingredients = CONFIG.ingredients.slice();
  var _order = {'full': [], 'half': []};
  
  for(i=0; i<X.level['full']; i++) {
    var j = Math.floor(Math.random() * _ingredients.length);
    _order.full.push(_ingredients[j]); // add ingredient
    _ingredients.splice(j, 1); // no repeated ingredients
  }
  
  for(i=0; i<X.level['half']; i++) {
    var j = Math.floor(Math.random() * _ingredients.length);
    _order.half.push(_ingredients[j]); // add ingredient
    _ingredients.splice(j, 1); // no repeated ingredients
  }
  
  return _order;
}

function checkIngredient(ingredient) {  
  if(X.order.indexOf(ingredient) != -1) { // correct
    X.order.splice(X.order.indexOf(ingredient), 1); // remove from recipe
    
    if(X.order.indexOf(ingredient) == -1)
      $('#order-note .'+ ingredient).addClass('strike'); // strike off from order note
    
    if(X.order.length == 0) doOrder(1); // success
  } else { // fail
    doOrder(0);
  }
}

function addIngredient(ingredient, side) {  
  if(side == 'left' && X.pizza._left.indexOf(ingredient) != -1) side = 'right';     
  else if(side == 'right' && X.pizza._right.indexOf(ingredient) != -1) side = 'left';
  
  X.pizza['_'+ side].push(ingredient);
  $('#pizza-'+ side +' .'+ ingredient).addClass('on');

  checkIngredient(ingredient);
}

function showMessage(msg) {
  $('#msg').text(msg);
  
  $('#msg').transition({y: 0, opacity: 1, easing: 'snap'}, function() {
    $(this).transition({y: 200, opacity: 0, delay: 140, easing: 'in'});
  })
}