"use strict";

//重みづけ(どこに優先して石を置くか)計算用の配列
let WeightData = [
	[30, -12, 0, -1, -1, 0, -12, 30],
	[-12, -15, -3, -3, -3, -3, -15, -12],
	[0, -3, 0, -1, -1, 0, -3, 0],
	[-1, -3, -1, -1, -1, -1, -3, -1],
	[-1, -3, -1, -1, -1, -1, -3, -1],
	[0, -3, 0, -1, -1, 0, -3, 0],
	[-12, -15, -3, -3, -3, -3, -15, -12],
	[30, -12, 0, -1, -1, 0, 12, 30],
];
let BLACK = 1;		//盤面dataに置かれた石(黒)を1で表現
let WHITE = 2;		//盤面dataに置かれた石(白)を2で表現
let data = [];		//盤面における石の配置状態を保持する配列
let myTurn = false;	//自分の番か否か

//初期化関数
function init() {
	let b = document.getElementById("board");
	//縦軸
	for (let i = 0; i < 8; i++) {
		let tr = document.createElement("tr");
		data[i] = [0, 0, 0, 0, 0, 0, 0, 0];
		//横軸
		for (let j = 0; j < 8; j++) {
			let td = document.createElement("td");
			td.className = "cell";
			td.id = "cell" + i + j;
			td.onclick = clicked;
			tr.appendChild(td);
		}
		b.appendChild(tr);
	}
	//最初の4つの石を配置
	put(3, 3, BLACK);
	put(4, 4, BLACK);
	put(3, 4, WHITE);
	put(4, 3, WHITE);
	update();
}

function update() {
	let numWhite = 0;
	let numBlack = 0;
	//盤に置かれた石の数を数える
	for (let x = 0; x < 8; x++) {
		for (let y = 0; y < 8; y++) {
			if (data[x][y] == WHITE) {
				numWhite++;
			}
			if (data[x][y] == BLACK) {
				numBlack++;
			}
		}
	}
	//枚数を表示する
	document.getElementById("numBlack").textContent = numBlack;
	document.getElementById("numWhite").textContent = numWhite;
	//引数の石を盤に置くことができるか(=他の色を挟むことができるか)
	//配置できる状態であれば〜Flipはtrue
	let blackFlip = canFlip(BLACK);
	let whiteFlip = canFlip(WHITE);
	//白と黒の数の合計が64になる、もしくは白も黒も置けない場合はゲームオーバー
	if (numWhite + numBlack == 64 || (!blackFlip && !whiteFlip)) {
		showMessage("ゲームオーバー");
	}
	//石を置く順番を判定する処理
	else if (!blackFlip) {
		showMessage("黒スキップ");
		myTurn = false;
	}
	else if (!whiteFlip) {
		showMessage("白スキップ");
		myTurn = true;
	}
	//「!」は論理否定を行う演算子(trueはfalse、falseはtrueに変換される)
	else {
		myTurn = !myTurn;
	}
	//自分の番でないときはコンピュータに1秒間考えるフリをさせる
	if (!myTurn) {
		setTimeout(think, 1000);
	}
}

//引数で与えられた文字列を2秒間表示する
function showMessage(str) {
	document.getElementById("message").textContent = str;
	setTimeout(function () {
		document.getElementById("message").textContent = "";
	}, 2000);
}

//盤上のセルクリック時のコールバック関数
function clicked(e) {
	//考え中(myTurnがfalseのときは思考中のフリなので何もせず戻る)
	if (!myTurn) {
		return;
	}
	//どのtdがクリックされたのか調べるためのidを取得している
	let id = e.target.id;
	//縦・横の座標を求め、そこに黒を置いたときに反転する石を配列で求める
	let i = parseInt(id.charAt(4));
	let j = parseInt(id.charAt(5));
	let flipped = getFlipCells(i, j, BLACK);
	//反転する石が0より多い場合(反転する石があった場合)
	if (flipped.length > 0) {
		//石を反転させ、その場所に黒石を置いている
		for (let k = 0; k < flipped.length; k++) {
			put(flipped[k][0], flipped[k][1], BLACK);
		}
		put(i, j, BLACK);
		update();
	}
}

//(i, j)にcolor色の駒を置く
function put(i, j, color) {
	let c = document.getElementById("cell" + i + j);
	c.textContent = "●";
	c.className = "cell " + (color == BLACK ? "black" : "white");
	data[i][j] = color;
}

//コンピュータ思考関数
function think() {
	let highScore = -1000;
	let px = -1;
	let py = -1;
	//64マスのすべての場所をfor文の二重ループを使用して調査
	for (let x = 0; x < 8; x++) {
		for (let y = 0; y < 8; y++) {
			//「仮にこの場所に白を置いたときにどうなるか」という状態を再現するための
			//仮データtmpDataを作るために現在のdataをコピーしたものを返す
			let tmpData = copyData();
			//(x, y)座標に白を置いたときに反転する石の配列を求める
			let flipped = getFlipCells(x, y, WHITE);
			//石がある場合、仮データtmpDataに値を設定する
			if (flipped.length > 0) {
				for (let i = 0; i < flipped.length; i++) {
					let p = flipped[i][0];
					let q = flipped[i][1];
					tmpData[p][q] = WHITE;
					tmpData[x][y] = WHITE;
				}
				//合計点を計算
				let score = calcWeightData(tmpData);
				//スコアがハイスコアより大きい場合(今の打ち手のほうがより高得点のとき)
				if (score > highScore) {
					highScore = score;
					//現在の(x, y)座標を保存
					px = x;
					py = y;
				}
			}
		}
	}
	//px,、pyの両方が0以上ということはどこかに石を置けたことを意味するため、
	//その場所に白石を置く
	if (px >= 0 && py >= 0) {
		let flipped = getFlipCells(px, py, WHITE);
		if (flipped.length > 0) {
			for (let k = 0; k < flipped.length; k++) {
				put(flipped[k][0], flipped[k][1], WHITE);
			}
		}
		put(px, py, WHITE);
	}
	update();
}

//重みづけ計算
//引数で与えられた盤面データ(2次元配列)の優先順位の合計値を求めて返す
function calcWeightData(tmpData) {
	let score = 0;
	for (let x = 0; x < 8; x++) {
		for (let y = 0; y < 8; y++) {
			//白の置かれた場所の重みをscoreに足してその合計を返す
			if (tmpData[x][y] == WHITE) {
				score += WeightData[x][y];
			}
		}
	}
	return score;
}

//駒テーブルデータをコピー
function copyData() {
	let tmpData = [];
	for (let x = 0; x < 8; x++) {
		tmpData[x] = [];
		for (let y = 0; y < 8; y++) {
			tmpData[x][y] = data[x][y];
		}
	}
	return tmpData;
}

//挟める駒があるか？
//盤面に引数の色の石が置けるか否かを返す
function canFlip(color) {
	for (let x = 0; x < 8; x++) {
		for (let y = 0; y < 8; y++) {
			//座標(x, y)に石を置いたときに反転する数を求める
			let flipped = getFlipCells(x, y, color);
			if (flipped.length > 0) {
				return true;
			}
		}
	}
	return false;
}

//(i, j)に駒を置いたときに駒を挟めるか？
//(i, j)座標にcolorの石を置いたときに反転する石の配列を返す
function getFlipCells(i, j, color) {
	//既に駒がある場合は挟めないため空の配列[]を返す
	if (data[i][j] == BLACK || data[i][j] == WHITE) {
		return [];
	}
	//相手を挟めるか、左上、上、右上、左、右、左下、下、右下と順番に調査
	let dirs = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
	let result = [];
	//各方向を配列dirs格納し、for文を使って方向ごとに石を挟めるか否かを判定する
	for (let p = 0; p < dirs.length; p++) {
		let flipped = getFlipCellsOneDir(i, j, dirs[p][0], dirs[p][1], color);
		//反転した座標を格納
		result = result.concat(flipped);
	}
	return result;
}

//(i, j)に駒をおいたときに、(dx, dy)方向で駒を挟めるか？
//(i, j)を起点として、(dx, dy)方向に、color色の石で挟めるかを返す
function getFlipCellsOneDir(i, j, dx, dy, color) {
	let x = i + dx;
	let y = j + dy;
	let fliped = [];
	//となりが同じ色、盤の外、石がないといった場合は単に空配列[]を返す
	if (x < 0 || y < 0 || x > 7 || y > 7 ||
		data[x][y] == color || data[x][y] == 0) {
		//盤外、同色、空ならfalse
		return [];
	}
	//そうでなければ別の色の石がその方向に隣接していることになるため、
	//その石の座hy用を仮に配列flipedに格納しておく
	fliped.push([x, y]);
	//方向を順番に見ていく
	while (true) {
		//ひとつ先に進める
		x += dx;
		y += dy;
		//盤外、空になったら挟めなかったということなので空配列[]を返す
		if (x < 0 || y < 0 || x > 7 || y > 7 || data[x][y] == 0) {
			//盤外、空ならfalse
			return [];
		}
		//挟めた(その座標に同じ色があった場合)
		if (data[x][y] == color) {
			return fliped;
		}
		//それ以外(別の色が連続していた)
		else {
			fliped.push([x, y]);
		}
	}
}