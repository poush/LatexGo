-- Kana Parser lua engine

local vowels = {'a', 'e', 'i', 'o', 'u'} -- latin vowels
local vowelsK = {'ア', 'エ', 'イ', 'オ', 'ウ'} -- katakana vowels
local ambigousToN = {'あ', 'え', 'い', 'お', 'う', 'や', 'よ', 'ゆ'} -- characters ambiguous to preceding "n"
local littleTsuWL = {'s', 't', 'k', 'p', 'c'} -- whitelist for little tsu gemination
local transRaw = { -- latin -> hiragana
	n = 'ん', a = 'あ', e = 'え', i = 'い', o = 'お', u = 'う',
	ba = 'ば', be = 'べ', bi = 'び', bo = 'ぼ', bu = 'ぶ',
	bya = 'びゃ', byo = 'びょ', byu = 'びゅ',
	cha = 'ちゃ', che = 'ちぇ', chi = 'ち', cho = 'ちょ', chu = 'ちゅ',
	da = 'だ', de = 'で', di = 'でぃ', ['do'] = 'ど', du = { 'づ', 'どぅ' },
	dya = 'でゃ', dyo = 'でょ', dyu = 'でゅ',
	fa = 'ふぁ', fe = 'ふぇ', fi = 'ふぃ', fo = 'ふぉ',
	fya = 'ふゃ', fyo = 'ふょ', fyu = 'ふゅ',
	ga = 'が', ge = 'げ', gi = 'ぎ', go = 'ご', gu = 'ぐ',
	gwa = 'ぐぁ', gwe = 'ぐぇ', gwi = 'ぐぃ', gwo = 'ぐぉ', gya = 'ぎゃ', gyo = 'ぎょ', gyu = 'ぎゅ',
	ha = 'は', he = 'へ', hi = 'ひ', ho = 'ほ', hu = 'ふ',
	hya = 'ひゃ', hyo = 'ひょ', hyu = 'ひゅ',
	ja = { 'じゃ', 'ぢゃ' }, je = 'じぇ', ji = { 'じ', 'ぢ' }, jo = { 'じょ', 'ぢょ' }, ju = { 'じゅ', 'ぢゅ' },
	ka = 'か', ke = 'け', ki = 'き', ko = 'こ', ku = 'く',
	kwa = 'くぁ', kwe = 'くぇ', kwi = 'くぃ', kwo = 'くぉ', kya = 'きゃ', kyo = 'きょ',	kyu = 'きゅ',
	ma = 'ま', me = 'め', mi = 'み', mo = 'も', mu = 'む',
	mya = 'みゃ', myo = 'みょ', myu = 'みゅ',
	na = 'な', ne = 'ね', ni = 'に', no = 'の', nu = 'ぬ',
	nya = 'にゃ', nyo = 'にょ', nyu = 'にゅ',
	pa = 'ぱ', pe = 'ぺ', pi = 'ぴ', po = 'ぽ', pu = 'ぷ',
	pya = 'ぴゃ', pyo = 'ぴょ', pyu = 'ぴゅ',
	ra = 'ら', re = 'れ', ri = 'り', ro = 'ろ', ru = 'る',
	rya = 'りゃ', ryo = 'りょ', ryu = 'りゅ',
	sa = 'さ', se = 'せ', si = 'し',	so = 'そ', su = 'す',
	sha = 'しゃ', she = 'しぇ', shi = 'し', sho = 'しょ', shu = 'しゅ',
	ta = 'た', te = 'て', ti = 'てぃ', to = 'と',
	tha = 'てゃ', tho = 'てょ', thu = 'てゅ',
	tsa = 'つぁ', tse = 'つぇ', tsu = 'つ', tsi = 'つぃ', tso = 'つぉ',
	tu = 'つ',
	va = 'ゔぁ', ve = 'ゔぇ', vi = 'ゔぃ', vo = 'ゔぉ', vu = 'ゔぅ',
	vya = 'ゔゃ', vyo = 'ゔょ', vyu = 'ゔゅ',
	wa = 'わ', we = { 'うぇ', 'ゑ' }, wi = 'ゐ', wo = { 'を', 'うぉ' },
	ya = 'や', ye = 'いぇ', yo = 'よ', yu = 'ゆ',
	za = 'ざ', ze = 'ぜ', zo = 'ぞ', zu = 'ず'
}
local transK = { -- hiragana -> katakana
	['ん'] = 'ン', ['あ'] = 'ア', ['え'] = 'エ', ['い'] = 'イ', ['お'] = 'オ', ['う'] = 'ウ',
	['ぁ'] = 'ァ', ['ぃ'] = 'ィ', ['ぅ'] = 'ゥ', ['ぇ'] = 'ェ', ['ぉ'] = 'ォ',
	['ゃ'] = 'ャ', ['ゅ'] = 'ュ', ['ょ'] = 'ョ',
	['は'] = 'ハ', ['へ'] = 'ヘ', ['ひ'] = 'ヒ', ['ほ'] = 'ホ', ['ふ'] = 'フ',
	['ば'] = 'バ', ['べ'] = 'ベ', ['び'] = 'ビ', ['ぼ'] = 'ボ', ['ぶ'] = 'ブ',
	['ぱ'] = 'パ', ['ぺ'] = 'ペ', ['ぴ'] = 'ピ', ['ぽ'] = 'ポ', ['ぷ'] = 'プ',
	['た'] = 'タ', ['て'] = 'テ', ['ち'] = 'チ', ['と'] = 'ト', ['つ'] = 'ツ',
	['だ'] = 'ダ', ['で'] = 'デ', ['ぢ'] = 'ヂ', ['ど'] = 'ド', ['づ'] = 'ヅ',
	['か'] = 'カ', ['け'] = 'ケ', ['き'] = 'キ', ['こ'] = 'コ', ['く'] = 'ク',
	['が'] = 'ガ', ['げ'] = 'ゲ', ['ぎ'] = 'ギ', ['ご'] = 'ゴ', ['ぐ'] = 'グ',
	['ま'] = 'マ', ['め'] = 'マ', ['み'] = 'マ', ['も'] = 'モ', ['む'] = 'マ',
	['な'] = 'ナ', ['ね'] = 'ネ', ['に'] = 'ニ', ['の'] = 'ノ', ['ぬ'] = 'ヌ',
	['ら'] = 'ラ', ['れ'] = 'レ', ['り'] = 'リ', ['ろ'] = 'ロ', ['る'] = 'ル',
	['さ'] = 'サ', ['せ'] = 'セ', ['し'] = 'シ', ['そ'] = 'ソ', ['す'] = 'ス',
	['ざ'] = 'ザ', ['ぜ'] = 'ゼ', ['じ'] = 'ジ', ['ぞ'] = 'ゾ', ['ず'] = 'ズ',
	['わ'] = 'ワ', ['ゑ'] = 'ヱ', ['ゐ'] = 'ヰ', ['を'] = 'ヲ',
	['や'] = 'ヤ', ['よ'] = 'ヨ', ['ゆ'] = 'ユ',
	['ゔ'] = 'ヴ', ['っ'] = 'ッ'
}
local correctionsFromKana = { -- manual transliteration choices
	['し'] = 'shi'
}
local longK = 'ー'
local isolator = '\''
local prolongRules = { -- special rules for prolonging syllables
	o = 'u',
	e = 'i'
}

-- builds a reverse table
local function rev(t)
	local res = {}
	for k, v in pairs(t) do
		if (type(v) == 'table') then
			res[v[1]] = k
			res[v[2]] = k
		else
			res[v] = k
		end
	end
	return res
end

-- builds the default translation tables latin <-> kana from transRaw
local function buildDefaultTransTables()
	local tr, rtr = {}, {}
	
	for k, v in pairs(transRaw) do
		tr[k] = type(v) == 'table' and v[1] or v
	end

	rtr = rev(tr)

	-- apply corrections
	for i, v in pairs(correctionsFromKana) do
		rtr[i] = v
	end

	return tr, rtr, rev(transK)
end

-- decides which wovel should prolong the given vowel
local function prolong(c)
	for i, v in ipairs(vowels) do
		if c == v then
			if prolongRules[c] then return prolongRules[c] else return c end
		end
	end
	return nil
end

-- checks if a katakana token is a vowel and returns its latin representation
local function getWovelK(c)
	for i, v in ipairs(vowelsK) do
		if c == v then return vowels[i] end
	end
	return nil
end

-- checks if a given symbol is ambiguous to preceding n
local function isAmbiguous(c)
	for i, v in ipairs(ambigousToN) do
		if c == v then return true end
	end
	return false
end

-- init translation tables
local trans, revTrans, revTransK = buildDefaultTransTables()

-- init default transliteration choices (everything default to first alternative)
local transChoices = {}

-- checks if two characters are valid candidates for little tsu
local function isValidTsuCandidate(a, b)
	if a ~= b then return false end
	for i, v in ipairs(littleTsuWL) do
		if a == v then return true end
	end
	return false
end

-- checks if two characters are a little tsu used correctly and returns the gemination consonant if true
local function getGeminationConsonant(a, b)
	if a ~= 'っ' then return nil end -- disregard katakana, only hiragana is processed in romanization
	local tr = revTrans[b]
	if not tr then return nil end -- invalid hiragana character
	local fst = string.sub(tr, 1, 1) -- get first character of the transliteration
	for i, v in ipairs(littleTsuWL) do
		if fst == v then return fst end
	end
	return nil -- invalid gemination
end

-- parses an utf8 string into utf8 chars (tokens)
local function tokenize(utf8str)
	assert(type(utf8str) == 'string')
	local res, seq, val = {}, 0, ''
	for i = 1, #utf8str do
		local c = string.byte(utf8str, i)
		if seq == 0 then
			if i ~= 1 then table.insert(res, val) end
			seq = c < 0x80 and 1 or c < 0xE0 and 2 or c < 0xF0 and 3 or
			      c < 0xF8 and 4 or error('invalid UTF-8 character sequence')
			val = string.char(c)
		else
			val = val .. string.char(c)
		end
		seq = seq - 1
	end
	table.insert(res, val)
	return res
end

-- PUBLIC API SECTION

-- toggles used characters for supplied syllables (whitespace-separated)
function toggleChars(input)
	local cur, choices = '', {}
	for s in string.gmatch(input, '%S+') do -- split by whitespaces
		cur = trans[s]
		if cur then -- don't process unknown syllables
			choices = transRaw[s]
			if type(choices) == 'table' then -- only process syllables with alternatives
				trans[s] = cur == choices[1] and choices[2] or choices[1] -- toggle between alternatives
			end
		end
	end
end

-- any kana to latin
function toLatin(input)
	if input == '' then return end
	local tbl = tokenize(input)
	local buffer, res = {}, ''

	-- read tokenized input
	local tjoin, tfst, last, gc = '', '', 0, '' -- last is the last valid transliterated vowel, gc is the last gemination consonant
	for i, v in ipairs(tbl) do
		if revTransK[v] ~= nil then v = revTransK[v] end -- convert all katakana to hiragana
		table.insert(buffer, v)

		if #buffer == 2 then -- kana can be formed with up to two characters, always keep two in buffer
			tjoin, tfst, gc = revTrans[ buffer[1] .. buffer[2] ], revTrans[ buffer[1] ], getGeminationConsonant(buffer[1], buffer[2])
			if tjoin ~= nil then -- double character
				res = res .. tjoin
				buffer, last = {}, string.sub(tjoin, -1)
			elseif gc then -- check for little tsu
				res = res .. gc
				buffer, last = {buffer[2]}, 0
			elseif tfst ~= nil then -- single character
				res = res .. tfst
				if tfst == 'n' and isAmbiguous(buffer[2]) then -- ambiguous character succeeding an "n"
					res = res .. isolator
				end
				buffer, last = {buffer[2]}, string.sub(tfst, -1)
			elseif buffer[1] == longK and prolong(last) ~= nil then -- prolonging dash
				res = res .. prolong(last)
				buffer, last = {buffer[2]}, 0
			else -- cannot transliterate, output as-is
				res = res .. buffer[1]
				buffer, last = {buffer[2]}, 0
			end
		end
	end

	if #buffer == 1 then -- trailing character
		if revTrans[ buffer[1] ] ~= nil then -- single character
			res = res .. revTrans [ buffer[1] ]
		elseif buffer[1] == longK and prolong(last) ~= nil then -- prolonging dash
			res = res .. prolong(last)
		else -- cannot transliterate, output as-is
			res = res .. buffer[1]
		end
	end

	tex.print(res)
end

-- latin or katakana to hiragana, 'raw' parameter is for internal use, leave it blank to get output to TeX
function toHiragana(input, raw)
	if input == '' then return end
	local tbl = tokenize(input)
	local buffer, res = {}, ''
	local t3, t2, t1, last, lastsym, lastcnd = '', '', '', 0, nil, nil

	for i, v in ipairs(tbl) do
		if revTransK[v] then v = revTransK[v] end -- translate katakana to hiragana on the go
		table.insert(buffer, v)

		if #buffer == 3 then
			t3, t2, t1 = trans[ buffer[1] .. buffer[2] .. buffer[3] ], trans[ buffer[1] .. buffer[2] ], trans[ buffer[1] ]
			if t3 ~= nil then -- all three letters yield translation
				if lastcnd then -- add little tsu
					res = res .. 'っ'
					lastcnd = nil
				end
				res = res .. t3
				last = buffer[3]
				buffer = {}
			elseif t2 ~= nil then -- first two letters yield translation
				if lastcnd then -- add little tsu
					res = res .. 'っ'
					lastcnd = nil
				end
				res = res .. t2
				last = buffer[2]
				buffer = {buffer[3]}
			elseif isValidTsuCandidate(buffer[1], buffer[2]) then -- test little tsu candidates
				if lastcnd then res = res .. lastcnd end -- add last consonant in raw form
				lastcnd = buffer[1] -- set last candidate consonant
				last = 0 -- is not vowel
				buffer = {buffer[2], buffer[3]}
			elseif t1 ~= nil then -- first letter yields translation : a, e, i, o, u, n
				res = res .. t1
				last = buffer[1]
				buffer = {buffer[2], buffer[3]}
			elseif buffer[1] == longK and prolong(last) ~= nil then -- valid prolonger sign
				res = res .. trans[prolong(last)]
				buffer, last = {buffer[2], buffer[3]}, 0
			elseif buffer[1] == isolator then -- isolating apostrophe, consume it
				buffer = {buffer[2], buffer[3]}
			else
				if lastcnd then -- add last consonant in raw form
					res = res .. lastcnd
					lastcnd = nil
				end

				-- this code allows for proper conversion of katakana's prolongation dash to hiragana
				t1 = revTrans[ buffer[1] ]
				if t1 then -- symbol is standalone hiragana
					last = string.sub(t1, -1)
					lastsym = buffer[1]
				elseif lastsym then -- attempt to merge symbol with previous symbol
					t1 = revTrans[ lastsym .. buffer[1] ]
					if t1 then -- symbol is a valid non-standalone hiragana compound
						last = string.sub(t1, -1)
					else -- symbol is an invalid non-standalone hiragana compound
						last = nil
					end
					lastsym = nil
				else
					last, lastsym = 0, nil
				end
				
				res = res .. buffer[1]
				buffer = {buffer[2], buffer[3]}
			end
		end
	end

	if #buffer == 2 then
		if trans[ buffer[1] .. buffer[2] ] ~= nil then -- first two symbols yield translation
			if lastcnd then res = res .. 'っ' end -- add little tsu
			res = res .. trans[ buffer[1] .. buffer[2] ]
			last = buffer[2]
			buffer = {}
		elseif trans[ buffer[1] ] ~= nil then -- first symbol yields translation
			res = res .. trans[ buffer[1] ]
			last = buffer[1]
			buffer = {buffer[2]}
		elseif buffer[1] == longK and prolong(last) ~= nil then -- valid prolonger
			res = res .. trans[prolong(last)]
			buffer, last = {buffer[2]}, 0
		elseif buffer[1] == isolator then -- consume isolator
			buffer = {buffer[2]}
		else
			if lastcnd then res = res .. lastcnd end -- add last consonant in raw form

			-- this code allows for proper conversion of katakana's prolongation dash to hiragana
			t1 = revTrans[ buffer[1] ]
			if t1 then -- symbol is standalone hiragana
				last = string.sub(t1, -1)
				lastsym = buffer[1]
			elseif lastsym then -- attempt to merge symbol with previous symbol
				t1 = revTrans[ lastsym .. buffer[1] ]
				if t1 then -- symbol is a valid non-standalone hiragana compound
					last = string.sub(t1, -1)
				else -- symbol is an invalid non-standalone hiragana compound
					last = nil
				end
				lastsym = nil -- erase last valid symbol
			else
				last, lastsym = 0, nil
			end

			res = res .. buffer[1]
			buffer = {buffer[2]}
		end
	end

	if #buffer == 1 then -- remaining symbol
		if trans[ buffer[1] ] ~= nil then
			res = res .. trans[ buffer[1] ]
		elseif buffer[1] == longK and prolong(last) ~= nil then
			res = res .. trans[prolong(last)]
		elseif buffer[1] ~= isolator then
			res = res .. buffer[1]
		end
	end

	if not raw then
		tex.print(res)
	else
		return res -- for internal use
	end
end

-- latin or hiragana to katakana
function toKatakana(input)
	if input == '' then return end
	local hiraganized = tokenize(toHiragana(input, true)) -- convert everything to hiragana

	-- replace hiragana with katakana
	for i, v in ipairs(hiraganized) do
		if transK[v] ~= nil then
			hiraganized[i] = transK[v]
		end
	end

	-- insert prolonging symbols and prepare output
	local prev, nxt, vowel, tprev, tnext, res = hiraganized[1], '', '', '', '', hiraganized[1]
	local merge, toprolong = '', nil
	for i = 2, #hiraganized do
		nxt = hiraganized[i]

		vowel = getWovelK(nxt)

		if not toprolong then -- check prev for ending vowel
			tprev = revTransK[prev]
			if tprev then
				tprev = revTrans[tprev]
				if tprev then
					toprolong = prolong(string.sub(tprev, -1))
				end
			end
		end

		if toprolong then -- check nxt for matching prolonger
			if toprolong == vowel then
				nxt = longK
				toprolong = nil
			elseif vowel then
				toprolong = prolong(vowel)
			else
				toprolong = nil
			end
		end

		-- try merging prev and nxt for a single token
		tprev, tnext = revTransK[prev], revTransK[nxt]
		if tprev and tnext then
			merge = revTrans[tprev .. tnext]
			if merge then
				toprolong = prolong(string.sub(merge, -1))
			end
		end

		res = res .. nxt
		prev = nxt
	end

	tex.print(res)
end
