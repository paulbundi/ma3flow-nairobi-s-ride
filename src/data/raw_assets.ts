// Raw GTFS-like data for Nairobi Matatu routes
// Format: CSV with stop_id,stop_name,stop_lat,stop_lon

export const STOPS_DATA = `stop_id,stop_name,stop_lat,stop_lon
1,Kencom,-1.2864,36.8172
2,Fire Station,-1.2831,36.8200
3,Globe Cinema,-1.2798,36.8230
4,Ngara,-1.2745,36.8285
5,Pangani,-1.2680,36.8350
6,Muthaiga,-1.2580,36.8380
7,Roasters,-1.2450,36.8485
8,Survey,-1.2380,36.8550
9,Kasarani,-1.2250,36.8650
10,Roysambu,-1.2100,36.8750
11,Githurai 45,-1.1980,36.8900
12,Kahawa West,-1.1850,36.9050
13,Bus Station,-1.2858,36.8261
14,Koja,-1.2841,36.8289
15,Odeon,-1.2820,36.8240
16,University Way,-1.2810,36.8150
17,Kenyatta Avenue,-1.2830,36.8100
18,Uhuru Highway,-1.2850,36.8050
19,Museum Hill,-1.2750,36.8050
20,Westlands,-1.2650,36.8030
21,Sarit Centre,-1.2580,36.7980
22,Parklands,-1.2620,36.8100
23,Highridge,-1.2550,36.8000
24,Kangemi,-1.2580,36.7450
25,Mountain View,-1.2520,36.7380
26,Uthiru,-1.2450,36.7200
27,Kinoo,-1.2380,36.6950
28,Kikuyu,-1.2450,36.6650
29,Mwimuto,-1.2520,36.6850
30,Sigona,-1.2350,36.6450
31,Limuru,-1.1050,36.6450
32,Tigoni,-1.1350,36.6600
33,Banana Hill,-1.1580,36.6800
34,Ruaka,-1.2050,36.7680
35,Two Rivers,-1.2150,36.7850
36,Gigiri,-1.2350,36.7950
37,Runda,-1.2200,36.8050
38,Muthaiga North,-1.2150,36.8200
39,Garden Estate,-1.2180,36.8680
40,Mirema,-1.2050,36.8780
41,Zimmerman,-1.2000,36.8950
42,Kahawa Sukari,-1.1920,36.9150
43,Mwiki,-1.2150,36.9050
44,Kasarani Mwiki,-1.2200,36.9000
45,Githurai 44,-1.2050,36.8850
46,Thome,-1.2150,36.8850
47,Kariobangi,-1.2500,36.8780
48,Huruma,-1.2580,36.8650
49,Mathare,-1.2620,36.8580
50,Eastleigh,-1.2750,36.8450
51,Juja Road,-1.2700,36.8380
52,Muthurwa,-1.2850,36.8320
53,Railways,-1.2920,36.8280
54,Nyamakima,-1.2870,36.8210
55,GPO,-1.2890,36.8195
56,Hilton,-1.2875,36.8180
57,Ambassador,-1.2850,36.8165
58,Kenyatta Hospital,-1.3020,36.8050
59,Nairobi West,-1.3150,36.8100
60,South B,-1.3100,36.8250
61,South C,-1.3180,36.8150
62,Langata,-1.3380,36.7580
63,Karen,-1.3220,36.7080
64,Ngong,-1.3580,36.6550
65,Rongai,-1.3950,36.7450
66,Kitengela,-1.4750,36.9580
67,Athi River,-1.4580,36.9850
68,Mlolongo,-1.3950,36.9450
69,Syokimau,-1.3650,36.9280
70,Imara Daima,-1.3380,36.9050
71,Pipeline,-1.3150,36.8880
72,Embakasi,-1.3250,36.9150
73,Utawala,-1.3350,36.9450
74,Donholm,-1.2980,36.8780
75,Umoja,-1.2850,36.8980
76,Buruburu,-1.2880,36.8850
77,Makadara,-1.2920,36.8580
78,Industrial Area,-1.3080,36.8450
79,City Stadium,-1.2950,36.8350
80,Nyayo Stadium,-1.3050,36.8250
81,Prestige,-1.2850,36.8620
82,Allsops,-1.2780,36.8550
83,Thika Town,-1.0330,37.0740
84,Ruiru,-1.1480,36.9580
85,Juja,-1.0980,37.0180
86,Githurai 45 Market,-1.2000,36.8920
87,TRM,-1.2280,36.8780
88,Safari Park,-1.2380,36.8650
89,GSU,-1.2450,36.8580
90,Muthaiga Police,-1.2520,36.8450
91,Limuru Road,-1.2480,36.8200
92,Limuru Road Junction,-1.2420,36.8100
93,Lower Kabete,-1.2380,36.7850
94,Upper Kabete,-1.2350,36.7680
95,Spring Valley,-1.2420,36.7980
96,Lavington,-1.2680,36.7780
97,Kilimani,-1.2880,36.7850
98,Yaya Centre,-1.2920,36.7950
99,Hurlingham,-1.2950,36.7980
100,Adams Arcade,-1.3050,36.7850`;

// Format: route_id,route_short_name,route_long_name,stop_sequence
export const ROUTES_DATA = `route_id,route_short_name,route_long_name,stop_id,stop_sequence
1,125,Thika Road - CBD,1,1
1,125,Thika Road - CBD,2,2
1,125,Thika Road - CBD,3,3
1,125,Thika Road - CBD,4,4
1,125,Thika Road - CBD,5,5
1,125,Thika Road - CBD,6,6
1,125,Thika Road - CBD,7,7
1,125,Thika Road - CBD,8,8
1,125,Thika Road - CBD,9,9
1,125,Thika Road - CBD,10,10
1,125,Thika Road - CBD,11,11
1,125,Thika Road - CBD,12,12
2,33,Westlands - CBD,1,1
2,33,Westlands - CBD,16,2
2,33,Westlands - CBD,17,3
2,33,Westlands - CBD,18,4
2,33,Westlands - CBD,19,5
2,33,Westlands - CBD,20,6
2,33,Westlands - CBD,21,7
3,23,Ngong - CBD,1,1
3,23,Ngong - CBD,55,2
3,23,Ngong - CBD,56,3
3,23,Ngong - CBD,57,4
3,23,Ngong - CBD,58,5
3,23,Ngong - CBD,80,6
3,23,Ngong - CBD,97,7
3,23,Ngong - CBD,96,8
3,23,Ngong - CBD,62,9
3,23,Ngong - CBD,63,10
3,23,Ngong - CBD,64,11
4,111,Ongata Rongai - CBD,1,1
4,111,Ongata Rongai - CBD,13,2
4,111,Ongata Rongai - CBD,53,3
4,111,Ongata Rongai - CBD,80,4
4,111,Ongata Rongai - CBD,62,5
4,111,Ongata Rongai - CBD,65,6
5,34,Kikuyu - CBD,1,1
5,34,Kikuyu - CBD,16,2
5,34,Kikuyu - CBD,18,3
5,34,Kikuyu - CBD,19,4
5,34,Kikuyu - CBD,20,5
5,34,Kikuyu - CBD,24,6
5,34,Kikuyu - CBD,25,7
5,34,Kikuyu - CBD,26,8
5,34,Kikuyu - CBD,27,9
5,34,Kikuyu - CBD,28,10
6,44,Ruaka - CBD,1,1
6,44,Ruaka - CBD,16,2
6,44,Ruaka - CBD,19,3
6,44,Ruaka - CBD,20,4
6,44,Ruaka - CBD,35,5
6,44,Ruaka - CBD,34,6
7,58,Eastleigh - CBD,1,1
7,58,Eastleigh - CBD,54,2
7,58,Eastleigh - CBD,15,3
7,58,Eastleigh - CBD,14,4
7,58,Eastleigh - CBD,50,5
7,58,Eastleigh - CBD,49,6
7,58,Eastleigh - CBD,48,7
8,9,South B - CBD,1,1
8,9,South B - CBD,13,2
8,9,South B - CBD,79,3
8,9,South B - CBD,80,4
8,9,South B - CBD,59,5
8,9,South B - CBD,60,6
9,34A,Limuru - CBD,1,1
9,34A,Limuru - CBD,4,2
9,34A,Limuru - CBD,91,3
9,34A,Limuru - CBD,92,4
9,34A,Limuru - CBD,33,5
9,34A,Limuru - CBD,32,6
9,34A,Limuru - CBD,31,7
10,100,Kitengela - CBD,1,1
10,100,Kitengela - CBD,13,2
10,100,Kitengela - CBD,78,3
10,100,Kitengela - CBD,70,4
10,100,Kitengela - CBD,69,5
10,100,Kitengela - CBD,68,6
10,100,Kitengela - CBD,66,7
11,45,Githurai - CBD,1,1
11,45,Githurai - CBD,2,2
11,45,Githurai - CBD,3,3
11,45,Githurai - CBD,4,4
11,45,Githurai - CBD,5,5
11,45,Githurai - CBD,47,6
11,45,Githurai - CBD,87,7
11,45,Githurai - CBD,45,8
11,45,Githurai - CBD,11,9
12,237,Ruiru - CBD,1,1
12,237,Ruiru - CBD,2,2
12,237,Ruiru - CBD,3,3
12,237,Ruiru - CBD,4,4
12,237,Ruiru - CBD,5,5
12,237,Ruiru - CBD,6,6
12,237,Ruiru - CBD,7,7
12,237,Ruiru - CBD,8,8
12,237,Ruiru - CBD,9,9
12,237,Ruiru - CBD,84,10
13,25,Karen - CBD,1,1
13,25,Karen - CBD,55,2
13,25,Karen - CBD,56,3
13,25,Karen - CBD,57,4
13,25,Karen - CBD,99,5
13,25,Karen - CBD,98,6
13,25,Karen - CBD,97,7
13,25,Karen - CBD,96,8
13,25,Karen - CBD,63,9
14,46,Donholm - CBD,1,1
14,46,Donholm - CBD,13,2
14,46,Donholm - CBD,77,3
14,46,Donholm - CBD,76,4
14,46,Donholm - CBD,75,5
14,46,Donholm - CBD,74,6
15,35,Kangemi - Westlands,20,1
15,35,Kangemi - Westlands,23,2
15,35,Kangemi - Westlands,95,3
15,35,Kangemi - Westlands,93,4
15,35,Kangemi - Westlands,24,5`;
