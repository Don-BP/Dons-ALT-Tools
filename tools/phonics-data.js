// js/tools/phonics-data.js

/**
 * A comprehensive, structured collection of phonics data for practice.
 * Follows a systematic, CUMULATIVE synthetic phonics progression.
 * Each set's words are made ONLY from graphemes in that set and preceding sets.
 * Words use <strong> tags to highlight the focus sound.
 */
export const phonicsData = {
    // --- NEW: Alphabet Section ---
    phase0_alphabet: {
        name: "Phase 0: The Alphabet",
        subgroups: {
            letter_sounds: {
                name: "Letter Sounds (a-z)",
                focus: "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z",
                cards: [
                    { word: "<strong>A</strong> is for <strong>a</strong>pple", image: "assets/phonics/apple.png", sentence: "A, a, apple." },
                    { word: "<strong>B</strong> is for <strong>b</strong>all", image: "assets/phonics/ball.png", sentence: "B, b, ball." },
                    { word: "<strong>C</strong> is for <strong>c</strong>at", image: "assets/phonics/cat.png", sentence: "C, c, cat." },
                    { word: "<strong>D</strong> is for <strong>d</strong>og", image: "assets/phonics/dog.png", sentence: "D, d, dog." },
                    { word: "<strong>E</strong> is for <strong>e</strong>gg", image: "assets/phonics/egg.png", sentence: "E, e, egg." },
                    { word: "<strong>F</strong> is for <strong>f</strong>ish", image: "assets/phonics/fish.png", sentence: "F, f, fish." },
                    { word: "<strong>G</strong> is for <strong>g</strong>oat", image: "assets/phonics/goat.png", sentence: "G, g, goat." },
                    { word: "<strong>H</strong> is for <strong>h</strong>and", image: "assets/phonics/hand.png", sentence: "H, h, hand." },
                    { word: "<strong>I</strong> is for <strong>i</strong>gloo", image: "assets/phonics/igloo.png", sentence: "I, i, igloo." },
                    { word: "<strong>J</strong> is for <strong>j</strong>uice", image: "assets/phonics/juice.png", sentence: "J, j, juice." },
                    { word: "<strong>K</strong> is for <strong>k</strong>ey", image: "assets/phonics/key.png", sentence: "K, k, key." },
                    { word: "<strong>L</strong> is for <strong>l</strong>ion", image: "assets/phonics/lion.png", sentence: "L, l, lion." },
                    { word: "<strong>M</strong> is for <strong>m</strong>onkey", image: "assets/phonics/monkey.png", sentence: "M, m, monkey." },
                    { word: "<strong>N</strong> is for <strong>n</strong>ose", image: "assets/phonics/nose.png", sentence: "N, n, nose." },
                    { word: "<strong>O</strong> is for <strong>o</strong>ctopus", image: "assets/phonics/octopus.png", sentence: "O, o, octopus." },
                    { word: "<strong>P</strong> is for <strong>p</strong>ig", image: "assets/phonics/pig.png", sentence: "P, p, pig." },
                    { word: "<strong>Q</strong> is for <strong>q</strong>ueen", image: "assets/phonics/queen.png", sentence: "Q, q, queen." },
                    { word: "<strong>R</strong> is for <strong>r</strong>ing", image: "assets/phonics/ring.png", sentence: "R, r, ring." },
                    { word: "<strong>S</strong> is for <strong>s</strong>un", image: "assets/phonics/sun.png", sentence: "S, s, sun." },
                    { word: "<strong>T</strong> is for <strong>t</strong>in", image: "assets/phonics/tin.png", sentence: "T, t, tin." },
                    { word: "<strong>U</strong> is for <strong>u</strong>mbrella", image: "assets/phonics/umbrella.png", sentence: "U, u, umbrella." },
                    { word: "<strong>V</strong> is for <strong>v</strong>iolin", image: "assets/phonics/violin.png", sentence: "V, v, violin." },
                    { word: "<strong>W</strong> is for <strong>w</strong>atch", image: "assets/phonics/watch.png", sentence: "W, w, watch." },
                    { word: "<strong>X</strong> is for bo<strong>x</strong>", image: "assets/phonics/box.png", sentence: "X, x, box." },
                    { word: "<strong>Y</strong> is for <strong>y</strong>o-yo", image: "assets/phonics/yo-yo.png", sentence: "Y, y, yo-yo." },
                    { word: "<strong>Z</strong> is for <strong>z</strong>ebra", image: "assets/phonics/zebra.png", sentence: "Z, z, zebra." }
                ]
            }
        }
    },
    // Phase 1: Suitable for Grade 1
    phase1_listening: {
        name: "Phase 1: Listening Skills",
        subgroups: {
            environmental: {
                name: "Environmental Sounds",
                focus: "Listening Skills",
                cards: [
                    { word: "cl<strong>a</strong>p", image: "assets/phonics/clap.png", sentence: "Clap your hands together." },
                    { word: "kn<strong>o</strong>ck", image: "assets/phonics/knock.png", sentence: "A knock at the door." },
                    { word: "r<strong>i</strong>ng", image: "assets/phonics/ring.png", sentence: "The phone is ringing." },
                    { word: "b<strong>ee</strong>p", image: "assets/phonics/car.png", sentence: "The car horn goes 'beep'." },
                    { word: "t<strong>i</strong>ck-tock", image: "assets/phonics/tick-tock.png", sentence: "The clock on the wall goes tick-tock." },
                    { word: "b<strong>a</strong>ng", image: "assets/phonics/bang.png", sentence: "The fireworks go bang!" },
                    { word: "dr<strong>i</strong>p", image: "assets/phonics/drip.png", sentence: "The tap goes drip, drip, drip." },
                    { word: "spl<strong>a</strong>sh", image: "assets/phonics/splash.png", sentence: "A big splash in the water." },
                ]
            }
        }
    },
    // Phase 2: Suitable for Grade 1-2
    phase2_cvc: {
        name: "Phase 2: Basic Sounds & CVC",
        subgroups: {
            set1_satpin: {
                name: "s, a, t, p, i, n",
                focus: "s,a,t,p,i,n",
                cards: [
                    { word: "<strong>a</strong>t", image: "assets/phonics/at.png", sentence: "Look at the dog." },
                    { word: "<strong>a</strong>n", image: "assets/phonics/an.png", sentence: "I see an ant." },
                    { word: "<strong>i</strong>t", image: "assets/phonics/it.png", sentence: "It is a big red ball." },
                    { word: "<strong>i</strong>n", image: "assets/phonics/in.png", sentence: "The apple is in the box." },
                    { word: "<strong>i</strong>s", image: "assets/phonics/is.png", sentence: "He is my friend." },
                    { word: "p<strong>a</strong>t", image: "assets/phonics/pat.png", sentence: "Pat the cat." },
                    { word: "t<strong>a</strong>p", image: "assets/phonics/tap.png", sentence: "Turn on the tap." },
                    { word: "s<strong>a</strong>t", image: "assets/phonics/sit.png", sentence: "I sat on the chair." },
                    { word: "s<strong>i</strong>t", image: "assets/phonics/sit.png", sentence: "Please sit down." },
                    { word: "p<strong>i</strong>n", image: "assets/phonics/pin.png", sentence: "A safety pin." },
                    { word: "t<strong>i</strong>n", image: "assets/phonics/tin.png", sentence: "A tin can." },
                    { word: "t<strong>i</strong>p", image: "assets/phonics/tip.png", sentence: "The tip of the pencil is sharp." },
                    { word: "s<strong>i</strong>p", image: "assets/phonics/sip.png", sentence: "Take a sip of water." },
                    { word: "p<strong>a</strong>n", image: "assets/phonics/pan.png", sentence: "A frying pan." },
                    { word: "n<strong>a</strong>p", image: "assets/phonics/nap.png", sentence: "The cat takes a nap." },
                ]
            },
            set2_mdgock: {
                name: "m, d, g, o, c, k",
                focus: "m,d,g,o,c,k",
                cards: [
                    { word: "<strong>m</strong>an", image: "assets/phonics/man.png", sentence: "A tall man." },
                    { word: "<strong>d</strong>ad", image: "assets/phonics/dad.png", sentence: "My dad is tall." },
                    { word: "<strong>g</strong>ot", image: "assets/phonics/got.png", sentence: "I got a new book." },
                    { word: "<strong>o</strong>n", image: "assets/phonics/on.png", sentence: "The book is on the table." },
                    { word: "<strong>c</strong>an", image: "assets/phonics/can.png", sentence: "I can do it!" },
                    { word: "<strong>k</strong>id", image: "assets/phonics/kid.png", sentence: "The kid is playing." },
                    { word: "c<strong>o</strong>t", image: "assets/phonics/cot.png", sentence: "The baby sleeps in a cot." },
                    { word: "d<strong>o</strong>g", image: "assets/phonics/dog.png", sentence: "A big, friendly dog." },
                    { word: "p<strong>o</strong>t", image: "assets/phonics/pot.png", sentence: "A pot of hot soup." },
                    { word: "m<strong>a</strong>p", image: "assets/phonics/map.png", sentence: "A map of the world." },
                    { word: "c<strong>a</strong>p", image: "assets/phonics/cap.png", sentence: "He wears a blue cap." },
                    { word: "d<strong>i</strong>g", image: "assets/phonics/dig.png", sentence: "Dig a hole in the sand." },
                    { word: "m<strong>o</strong>p", image: "assets/phonics/mop.png", sentence: "Mop the wet floor." },
                    { word: "a<strong>n</strong>d", image: "assets/phonics/and.png", sentence: "You and me." },
                ]
            },
            set3_ckeur: {
                name: "ck, e, u, r",
                focus: "ck,e,u,r",
                cards: [
                    { word: "p<strong>e</strong>n", image: "assets/phonics/pen.png", sentence: "I write with a pen." },
                    { word: "n<strong>e</strong>t", image: "assets/phonics/net.png", sentence: "A butterfly net." },
                    { word: "c<strong>u</strong>p", image: "assets/phonics/cup.png", sentence: "A cup of tea." },
                    { word: "s<strong>u</strong>n", image: "assets/phonics/sun.png", sentence: "The sun is shining." },
                    { word: "r<strong>u</strong>n", image: "assets/phonics/run.png", sentence: "The children run and play." },
                    { word: "r<strong>a</strong>t", image: "assets/phonics/rat.png", sentence: "The rat eats cheese." },
                    { word: "r<strong>e</strong>d", image: "assets/phonics/red.png", sentence: "The apple is red." },
                    { word: "r<strong>o</strong>ck", image: "assets/phonics/rock.png", sentence: "A big, grey rock." },
                    { word: "pi<strong>ck</strong>", image: "assets/phonics/pick.png", sentence: "Pick a flower." },
                    { "word": "ki<strong>ck</strong>", "image": "assets/phonics/kick.png", "sentence": "Kick the ball!" },
                    { word: "du<strong>ck</strong>", image: "assets/phonics/duck.png", sentence: "A duck swims in the pond." },
                    { word: "so<strong>ck</strong>", image: "assets/phonics/sock.png", sentence: "I lost my sock." },
                ]
            },
            set4_hbfllss: {
                name: "h, b, f, l, ss",
                focus: "h,b,f,l,ss",
                cards: [
                    { word: "<strong>h</strong>at", image: "assets/phonics/hat.png", sentence: "A tall, black hat." },
                    { word: "<strong>h</strong>en", image: "assets/phonics/hen.png", sentence: "The hen lays an egg." },
                    { word: "<strong>b</strong>ed", image: "assets/phonics/bed.png", sentence: "It's time for bed." },
                    { word: "<strong>b</strong>ag", image: "assets/phonics/bag.png", sentence: "My school bag is heavy." },
                    { word: "<strong>f</strong>an", image: "assets/phonics/fan.png", sentence: "The fan keeps me cool." },
                    { word: "<strong>f</strong>un", image: "assets/phonics/fun.png", sentence: "We have fun at the park." },
                    { word: "<strong>l</strong>eg", image: "assets/phonics/leg.png", sentence: "My leg is long." },
                    { word: "<strong>l</strong>et", image: "assets/phonics/let.png", sentence: "Let me help you." },
                    { word: "be<strong>ll</strong>", image: "assets/phonics/bell.png", sentence: "The school bell rings." },
                    { word: "fi<strong>ll</strong>", image: "assets/phonics/fill.png", sentence: "Fill the cup with water." },
                    { word: "hi<strong>ll</strong>", image: "assets/phonics/hill.png", sentence: "Let's run up the hill." },
                    { word: "pa<strong>ss</strong>", image: "assets/phonics/pass.png", sentence: "Can you pass the salt?" },
                    { word: "ki<strong>ss</strong>", image: "assets/phonics/kiss.png", sentence: "A kiss on the cheek." },
                    { word: "me<strong>ss</strong>", image: "assets/phonics/mess.png", sentence: "What a big mess!" },
                    { word: "mi<strong>ss</strong>", image: "assets/phonics/miss.png", sentence: "I miss my friend." },
                ]
            }
        }
    },
    // Phase 3: Suitable for Grade 2-3
    phase3_digraphs: {
        name: "Phase 3: Digraphs & Vowel Teams",
        subgroups: {
            set5_jvwxyz: {
                name: "j, v, w, x, y, z",
                focus: "j,v,w,x,y,z",
                cards: [
                    { word: "<strong>j</strong>et", image: "assets/phonics/jet.png", sentence: "The jet is very fast." },
                    { word: "<strong>j</strong>am", image: "assets/phonics/jam.png", sentence: "Strawberry jam on toast." },
                    { word: "<strong>j</strong>og", image: "assets/phonics/jog.png", sentence: "I like to jog in the morning." },
                    { word: "<strong>v</strong>an", image: "assets/phonics/van.png", sentence: "A big, white van." },
                    { word: "<strong>v</strong>et", image: "assets/phonics/vet.png", sentence: "The vet helps sick animals." },
                    { word: "<strong>w</strong>eb", image: "assets/phonics/web.png", sentence: "A spider's web." },
                    { word: "<strong>w</strong>et", image: "assets/phonics/wet.png", sentence: "My socks are wet." },
                    { word: "bo<strong>x</strong>", image: "assets/phonics/box.png", sentence: "What is in the box?" },
                    { word: "si<strong>x</strong>", image: "assets/phonics/six.png", sentence: "The number six." },
                    { word: "<strong>y</strong>es", image: "assets/phonics/yes.png", sentence: "Yes, I can." },
                    { word: "<strong>y</strong>et", image: "assets/phonics/yet.png", sentence: "Are we there yet?" },
                    { word: "<strong>z</strong>ip", image: "assets/phonics/zip.png", sentence: "Zip up your coat." },
                    { word: "bu<strong>zz</strong>", image: "assets/phonics/buzz.png", sentence: "The bee will buzz." },
                ]
            },
            set6_ch_sh_th_ng: {
                name: "ch, sh, th, ng",
                focus: "ch,sh,th,ng",
                cards: [
                    { word: "<strong>ch</strong>ip", image: "assets/phonics/chip.png", sentence: "A potato chip." },
                    { word: "<strong>ch</strong>op", image: "assets/phonics/chop.png", sentence: "Chop the vegetables." },
                    { word: "<strong>ch</strong>in", image: "assets/phonics/chin.png", sentence: "He has a small chin." },
                    { word: "ri<strong>ch</strong>", image: "assets/phonics/rich.png", sentence: "A rich chocolate cake." },
                    { word: "<strong>sh</strong>op", image: "assets/phonics/shop.png", sentence: "Let's go to the shop." },
                    { word: "<strong>sh</strong>ip", image: "assets/phonics/ship.png", sentence: "A big ship in the sea." },
                    { word: "fi<strong>sh</strong>", image: "assets/phonics/fish.png", sentence: "A fish swims in the water." },
                    { word: "ba<strong>th</strong>", image: "assets/phonics/bath.png", sentence: "Take a warm bath." },
                    { word: "<strong>th</strong>in", image: "assets/phonics/thin.png", sentence: "The book is thin." },
                    { word: "wi<strong>th</strong>", image: "assets/phonics/with.png", sentence: "Come with me." },
                    { word: "ri<strong>ng</strong>", image: "assets/phonics/ring.png", sentence: "A beautiful ring." },
                    { word: "si<strong>ng</strong>", image: "assets/phonics/sing.png", sentence: "I love to sing songs." },
                    { word: "so<strong>ng</strong>", image: "assets/phonics/song.png", sentence: "This is my favorite song." },
                    { word: "wi<strong>ng</strong>", image: "assets/phonics/wing.png", sentence: "A bird's wing." },
                ]
            },
            set7_ai_ee_igh_oa: {
                name: "ai, ee, igh, oa",
                focus: "ai,ee,igh,oa",
                cards: [
                    { word: "r<strong>ai</strong>n", image: "assets/phonics/rain.png", sentence: "I hear the rain." },
                    { word: "w<strong>ai</strong>t", image: "assets/phonics/wait.png", sentence: "Please wait for me." },
                    { word: "p<strong>ai</strong>n", image: "assets/phonics/pain.png", sentence: "I have a pain in my arm." },
                    { word: "s<strong>ai</strong>l", image: "assets/phonics/sail.png", sentence: "A boat with a white sail." },
                    { word: "s<strong>ee</strong>", image: "assets/phonics/see.png", sentence: "What do you see?" },
                    { word: "f<strong>ee</strong>t", image: "assets/phonics/feet.png", sentence: "My feet are cold." },
                    { word: "k<strong>ee</strong>p", image: "assets/phonics/keep.png", sentence: "Please keep the secret." },
                    { word: "w<strong>ee</strong>k", image: "assets/phonics/week.png", sentence: "There are seven days in a week." },
                    { word: "h<strong>igh</strong>", image: "assets/phonics/high.png", sentence: "The bird is high in the sky." },
                    { word: "l<strong>igh</strong>t", image: "assets/phonics/light.png", sentence: "Turn on the light." },
                    { "word": "n<strong>igh</strong>t", "image": "assets/phonics/night.png", "sentence": "Good night, sleep tight." },
                    { "word": "r<strong>igh</strong>t", "image": "assets/phonics/right.png", "sentence": "Turn right at the corner." },
                    { word: "b<strong>oa</strong>t", image: "assets/phonics/boat.png", sentence: "A boat on the lake." },
                    { word: "r<strong>oa</strong>d", image: "assets/phonics/road.png", sentence: "A long and winding road." },
                    { "word": "c<strong>oa</strong>t", "image": "assets/phonics/coat.png", "sentence": "Wear a coat, it's cold." },
                    { "word": "g<strong>oa</strong>t", "image": "assets/phonics/goat.png", "sentence": "The goat eats grass." },
                ]
            },
            set8_oo_ar_or_ur: {
                name: "oo(long/short), ar, or, ur",
                focus: "oo,ar,or,ur",
                cards: [
                    { word: "b<strong>oo</strong>k", image: "assets/phonics/book.png", sentence: "Please read a book." },
                    { word: "l<strong>oo</strong>k", image: "assets/phonics/look.png", sentence: "Look at the camera." },
                    { word: "f<strong>oo</strong>t", image: "assets/phonics/foot.png", sentence: "My foot is small." },
                    { word: "m<strong>oo</strong>n", image: "assets/phonics/moon.png", sentence: "The moon is bright." },
                    { word: "f<strong>oo</strong>d", image: "assets/phonics/food.png", sentence: "What is your favorite food?" },
                    { word: "p<strong>oo</strong>l", image: "assets/phonics/pool.png", sentence: "Let's swim in the pool." },
                    { word: "c<strong>ar</strong>d", image: "assets/phonics/card.png", sentence: "A birthday card." },
                    { word: "f<strong>ar</strong>m", image: "assets/phonics/farm.png", sentence: "A farmer works on a farm." },
                    { word: "p<strong>ar</strong>k", image: "assets/phonics/park.png", sentence: "Let's play in the park." },
                    { word: "sh<strong>ar</strong>p", image: "assets/phonics/sharp.png", sentence: "The knife is very sharp." },
                    { word: "f<strong>or</strong>k", image: "assets/phonics/fork.png", sentence: "Use a fork, not a spoon." },
                    { word: "h<strong>or</strong>n", image: "assets/phonics/horn.png", sentence: "The car has a loud horn." },
                    { word: "sh<strong>or</strong>t", image: "assets/phonics/short.png", sentence: "He is short." },
                    { word: "b<strong>ur</strong>n", image: "assets/phonics/burn.png", sentence: "The fire will burn." },
                    { word: "h<strong>ur</strong>t", image: "assets/phonics/hurt.png", sentence: "I hurt my arm." },
                    { word: "s<strong>ur</strong>f", image: "assets/phonics/surf.png", sentence: "Let's go surf at the beach." },
                ]
            }
        }
    },
    // Phase 4: Suitable for Grade 3-4
    phase4_blends: {
        name: "Phase 4: Consonant Blends",
        subgroups: {
            l_blends: {
                name: "L-Blends (bl, cl, fl, gl, pl, sl)",
                focus: "bl,cl,fl,gl,pl,sl",
                cards: [
                    { word: "<strong>bl</strong>ack", image: "assets/phonics/black.png", sentence: "A black cat." },
                    { word: "<strong>bl</strong>ot", image: "assets/phonics/blot.png", sentence: "An ink blot on the paper." },
                    { word: "<strong>cl</strong>ock", image: "assets/phonics/clock.png", sentence: "Look at the clock." },
                    { word: "<strong>cl</strong>am", image: "assets/phonics/clam.png", sentence: "A clam lives in the sea." },
                    { word: "<strong>cl</strong>ip", image: "assets/phonics/clip.png", sentence: "A paper clip." },
                    { word: "<strong>fl</strong>ag", image: "assets/phonics/flag.png", sentence: "A Japanese flag." },
                    { word: "<strong>fl</strong>at", image: "assets/phonics/flat.png", sentence: "The tire is flat." },
                    { word: "<strong>gl</strong>ass", image: "assets/phonics/glass.png", sentence: "A glass of water." },
                    { word: "<strong>gl</strong>ad", image: "assets/phonics/glad.png", sentence: "I am glad to see you." },
                    { word: "<strong>pl</strong>ug", image: "assets/phonics/plug.png", sentence: "Put the plug in the socket." },
                    { word: "<strong>pl</strong>um", image: "assets/phonics/plum.png", sentence: "A sweet, purple plum." },
                    { word: "<strong>sl</strong>ip", image: "assets/phonics/slip.png", sentence: "Be careful not to slip." },
                    { word: "<strong>sl</strong>ed", image: "assets/phonics/sled.png", sentence: "A sled for the snow." },
                ]
            },
            r_blends: {
                name: "R-Blends (br, cr, dr, fr, gr, pr, tr)",
                focus: "br,cr,dr,fr,gr,pr,tr",
                cards: [
                    { word: "<strong>br</strong>ick", image: "assets/phonics/brick.png", sentence: "A red brick." },
                    { word: "<strong>br</strong>ag", image: "assets/phonics/brag.png", sentence: "It is not nice to brag." },
                    { word: "<strong>cr</strong>ab", image: "assets/phonics/crab.png", sentence: "A crab on the beach." },
                    { word: "<strong>cr</strong>op", image: "assets/phonics/crop.png", sentence: "A crop of corn." },
                    { word: "<strong>dr</strong>um", image: "assets/phonics/drum.png", sentence: "He plays the drum." },
                    { word: "<strong>dr</strong>ess", image: "assets/phonics/dress.png", sentence: "A beautiful blue dress." },
                    { word: "<strong>dr</strong>op", image: "assets/phonics/drop.png", sentence: "A drop of rain." },
                    { word: "<strong>fr</strong>og", image: "assets/phonics/frog.png", sentence: "A green frog jumps." },
                    { word: "<strong>fr</strong>om", image: "assets/phonics/from.png", sentence: "This letter is from my friend." },
                    { word: "<strong>gr</strong>een", image: "assets/phonics/green.png", sentence: "The grass is green." },
                    { word: "<strong>gr</strong>in", image: "assets/phonics/grin.png", sentence: "A big, happy grin." },
                    { word: "<strong>pr</strong>am", image: "assets/phonics/pram.png", sentence: "A baby in a pram." },
                    { word: "<strong>tr</strong>ip", image: "assets/phonics/trip.png", sentence: "Let's go on a trip." },
                    { word: "<strong>tr</strong>ap", image: "assets/phonics/trap.png", sentence: "A mouse trap." },
                ]
            },
            s_blends: {
                name: "S-Blends (sc, sk, sm, sn, sp, st, sw)",
                focus: "sc,sk,sm,sn,sp,st,sw",
                cards: [
                    { word: "<strong>sc</strong>an", image: "assets/phonics/scan.png", sentence: "Scan the barcode." },
                    { word: "<strong>sk</strong>ip", image: "assets/phonics/skip.png", sentence: "I can skip." },
                    { word: "<strong>sk</strong>in", image: "assets/phonics/skin.png", sentence: "My skin is soft." },
                    { word: "<strong>sm</strong>ell", image: "assets/phonics/smell.png", sentence: "The flowers smell good." },
                    { word: "<strong>sn</strong>ail", image: "assets/phonics/snail.png", sentence: "The snail is very slow." },
                    { word: "<strong>sn</strong>ip", image: "assets/phonics/snip.png", sentence: "Snip the paper with scissors." },
                    { word: "<strong>sp</strong>ot", image: "assets/phonics/spot.png", sentence: "A dog with a spot." },
                    { word: "<strong>sp</strong>in", image: "assets/phonics/spin.png", sentence: "The top will spin." },
                    { word: "<strong>st</strong>op", image: "assets/phonics/stop.png", sentence: "Stop at the red light." },
                    { word: "<strong>st</strong>amp", image: "assets/phonics/stamp.png", sentence: "Put a stamp on the letter." },
                    { word: "<strong>st</strong>em", image: "assets/phonics/stem.png", sentence: "The stem of the flower." },
                    { word: "<strong>sw</strong>im", image: "assets/phonics/swim.png", sentence: "I like to swim." },
                    { word: "<strong>sw</strong>ing", image: "assets/phonics/swing.png", sentence: "Let's play on the swing." },
                ]
            }
        }
    },
    // Phase 5: Suitable for Grade 4-5
    phase5_alt_spellings: {
        name: "Phase 5: Alt. Spellings & Magic 'e'",
        subgroups: {
            magic_e: {
                name: "Magic 'e' (a_e, i_e, o_e, u_e)",
                focus: "a_e,i_e,o_e,u_e",
                cards: [
                    { word: "m<strong>a</strong>k<strong>e</strong>", image: "assets/phonics/make.png", sentence: "Let's make a cake." },
                    { word: "c<strong>a</strong>k<strong>e</strong>", image: "assets/phonics/cake.png", sentence: "A birthday cake." },
                    { word: "g<strong>a</strong>m<strong>e</strong>", image: "assets/phonics/game.png", sentence: "A fun board game." },
                    { word: "n<strong>a</strong>m<strong>e</strong>", image: "assets/phonics/name.png", sentence: "What is your name?" },
                    { word: "l<strong>i</strong>k<strong>e</strong>", image: "assets/phonics/like.png", sentence: "I like pizza." },
                    { word: "t<strong>i</strong>m<strong>e</strong>", image: "assets/phonics/time.png", sentence: "What time is it?" },
                    { word: "b<strong>i</strong>k<strong>e</strong>", image: "assets/phonics/bike.png", sentence: "I can ride my bike." },
                    { word: "n<strong>i</strong>n<strong>e</strong>", image: "assets/phonics/nine.png", sentence: "The number nine." },
                    { word: "h<strong>o</strong>m<strong>e</strong>", image: "assets/phonics/home.png", sentence: "Welcome to my home." },
                    { word: "n<strong>o</strong>t<strong>e</strong>", image: "assets/phonics/note.png", sentence: "Write a note." },
                    { word: "h<strong>o</strong>p<strong>e</strong>", image: "assets/phonics/hope.png", sentence: "I hope you are well." },
                    { word: "r<strong>o</strong>s<strong>e</strong>", image: "assets/phonics/rose.png", sentence: "A beautiful red rose." },
                    { word: "c<strong>u</strong>t<strong>e</strong>", image: "assets/phonics/cute.png", sentence: "A cute puppy." },
                    { word: "r<strong>u</strong>l<strong>e</strong>", image: "assets/phonics/rule.png", sentence: "Follow the rules." },
                    { word: "J<strong>u</strong>n<strong>e</strong>", image: "assets/phonics/june.png", sentence: "My birthday is in June." },
                ]
            },
            alt_long_a_e_i: {
                name: "Long 'a'/'e'/'i' (ay, ou, ie, ea, oy)",
                focus: "ay,ou,ie,ea,oy",
                cards: [
                    { word: "pl<strong>ay</strong>", image: "assets/phonics/play.png", sentence: "Let's play together." },
                    { word: "d<strong>ay</strong>", image: "assets/phonics/day.png", sentence: "Today is a sunny day." },
                    { word: "s<strong>ay</strong>", image: "assets/phonics/say.png", sentence: "What did you say?" },
                    { word: "<strong>ou</strong>t", image: "assets/phonics/out.png", sentence: "Go out and play." },
                    { word: "s<strong>ou</strong>nd", image: "assets/phonics/sound.png", sentence: "What is that sound?" },
                    { "word": "ab<strong>ou</strong>t", "image": "assets/phonics/about.png", "sentence": "Tell me about your day." },
                    { word: "t<strong>ie</strong>", image: "assets/phonics/tie.png", sentence: "He wears a red tie." },
                    { word: "cr<strong>ie</strong>d", image: "assets/phonics/cried.png", sentence: "The baby cried." },
                    { word: "p<strong>ie</strong>", image: "assets/phonics/pie.png", sentence: "An apple pie." },
                    { word: "t<strong>ea</strong>", image: "assets/phonics/tea.png", sentence: "A hot cup of tea." },
                    { word: "s<strong>ea</strong>", image: "assets/phonics/sea.png", sentence: "The fish swim in the sea." },
                    { word: "h<strong>ea</strong>d", image: "assets/phonics/head.png", sentence: "My head hurts." },
                    { word: "b<strong>oy</strong>", image: "assets/phonics/boy.png", sentence: "A happy boy." },
                    { word: "t<strong>oy</strong>", image: "assets/phonics/toy.png", sentence: "My favorite toy." },
                ]
            },
        }
    },
    // Phase 6: Suitable for Grade 5-6
    phase6_advanced: {
        name: "Phase 6: Advanced Patterns",
        subgroups: {
            silent_letters: {
                name: "Silent Letters (kn, wr, mb, gh)",
                focus: "kn,wr,mb,gh",
                cards: [
                    { word: "<strong>kn</strong>ife", image: "assets/phonics/knife.png", sentence: "Be careful with a knife." },
                    { word: "<strong>kn</strong>ee", image: "assets/phonics/knee.png", sentence: "I hurt my knee." },
                    { word: "<strong>kn</strong>ock", image: "assets/phonics/knock.png", sentence: "Knock on the door." },
                    { word: "<strong>kn</strong>ow", image: "assets/phonics/know.png", sentence: "I know the answer." },
                    { word: "<strong>wr</strong>ite", image: "assets/phonics/write.png", sentence: "Write your name." },
                    { word: "<strong>wr</strong>ong", image: "assets/phonics/wrong.png", sentence: "That answer is wrong." },
                    { word: "<strong>wr</strong>ap", image: "assets/phonics/wrap.png", sentence: "Wrap the present." },
                    { word: "<strong>wr</strong>ist", image: "assets/phonics/wrist.png", sentence: "I wear a watch on my wrist." },
                    { word: "co<strong>mb</strong>", image: "assets/phonics/comb.png", sentence: "Use a comb for your hair." },
                    { word: "la<strong>mb</strong>", image: "assets/phonics/lamb.png", sentence: "A little lamb." },
                    { word: "thu<strong>mb</strong>", image: "assets/phonics/thumb.png", sentence: "He gave a thumbs up." },
                    { word: "dou<strong>gh</strong>", image: "assets/phonics/dough.png", sentence: "Pizza dough." },
                    { word: "thou<strong>gh</strong>", image: "assets/phonics/though.png", sentence: "He is tired, though he keeps working." },
                ]
            },
            soft_c_g: {
                name: "Soft c / Soft g",
                focus: "c,g",
                cards: [
                    { word: "<strong>c</strong>ity", image: "assets/phonics/city.png", sentence: "Tokyo is a big city." },
                    { word: "<strong>c</strong>ell", image: "assets/phonics/cell.png", sentence: "A prison cell." },
                    { word: "fa<strong>c</strong>e", image: "assets/phonics/face.png", sentence: "She has a happy face." },
                    { word: "i<strong>c</strong>e", image: "assets/phonics/ice.png", sentence: "Ice is cold." },
                    { word: "ra<strong>c</strong>e", image: "assets/phonics/race.png", sentence: "A running race." },
                    { word: "ni<strong>c</strong>e", image: "assets/phonics/nice.png", sentence: "Have a nice day." },
                    { word: "<strong>g</strong>em", image: "assets/phonics/gem.png", sentence: "A shiny gem." },
                    { word: "ma<strong>g</strong>ic", image: "assets/phonics/magic.png", sentence: "It's like magic!" },
                    { word: "ca<strong>g</strong>e", image: "assets/phonics/cage.png", sentence: "A bird in a cage." },
                    { word: "pa<strong>g</strong>e", image: "assets/phonics/page.png", sentence: "Turn the page." },
                    { word: "sta<strong>g</strong>e", image: "assets/phonics/stage.png", sentence: "An actor on a stage." },
                    { word: "hu<strong>g</strong>e", image: "assets/phonics/huge.png", sentence: "An elephant is huge." },
                ]
            },
            advanced_vowels: {
                name: "Advanced Vowels (au, aw, ew, ou)",
                focus: "au,aw,ew,ou",
                cards: [
                    { word: "s<strong>au</strong>ce", image: "assets/phonics/sauce.png", sentence: "Tomato sauce for pasta." },
                    { word: "h<strong>au</strong>nt", image: "assets/phonics/haunt.png", sentence: "A ghost will haunt the house." },
                    { word: "dr<strong>aw</strong>", image: "assets/phonics/draw.png", sentence: "I like to draw pictures." },
                    { word: "p<strong>aw</strong>", image: "assets/phonics/paw.png", sentence: "The dog's paw is muddy." },
                    { word: "str<strong>aw</strong>", image: "assets/phonics/straw.png", sentence: "Drink with a straw." },
                    { word: "y<strong>aw</strong>n", image: "assets/phonics/yawn.png", sentence: "I yawn when I am tired." },
                    { word: "ch<strong>ew</strong>", image: "assets/phonics/chew.png", sentence: "Chew your food well." },
                    { word: "n<strong>ew</strong>", image: "assets/phonics/new.png", sentence: "I have new shoes." },
                    { word: "scr<strong>ew</strong>", image: "assets/phonics/screw.png", sentence: "Use a screwdriver for the screw." },
                    { word: "fl<strong>ew</strong>", image: "assets/phonics/flew.png", sentence: "The bird flew away." },
                    { word: "h<strong>ou</strong>se", image: "assets/phonics/house.png", sentence: "A big house with a red roof." },
                    { word: "cl<strong>ou</strong>d", image: "assets/phonics/cloud.png", sentence: "A white cloud in the blue sky." },
                    { word: "m<strong>ou</strong>se", image: "assets/phonics/mouse.png", sentence: "A little mouse ate the cheese." },
                    { word: "sh<strong>ou</strong>t", image: "assets/phonics/shout.png", sentence: "Please do not shout." },
                ]
            },
        }
    }
};