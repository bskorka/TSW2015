ZROBIONE

+ Serwowanie folderu /client/ za pomoca express
+ Logowanie/tworzenie pokoju
  + ekran logowania/tworzenia  pokoju
  + mechanizm tworzenia pokoju
+ stworzenie planszy gry
+ 1 faza gry - stawianie statkow
  + drag&drop
  + obracanie
  + sprawdzanie kolizji z innym statkiem
+ 2 faza gry - wojna
+ warunek koncowy 
  + zablokowanie strzelania na planszy / usuniêcie plansz
  + Wyœwietlenie wyniku w pojawiaj¹cym siê divie - (isReady: false)
  + zablokowanie obracania i przenoszenia statków po rozpoczêciu gry
  + wyœwietlenie komunikatu o rewan¿ - jeœli dwóch chêtnych (isReady) i znowu etap ustawiania statków
+ glyphicon do obrotu statków
+ obs³uga wyjœcia z pokoju
  + obs³uga wyjœcia u¿ytkownika i czyszczenie pokoju, ¿eby nie blokowa³
  + przy okazji ogarniêcie disconnecta po zakoñczeniu gry, bo na razie to przycisk bez u¿ycia
  + kiedy drugi gracz klika disconnect to wtedy wychodzi z pokoju, a gracz, który chcia³ rewan¿
    dostaje o tym informacjê i wyœwietla siê przycisk powrotu do listy pokojów
  + wyjœcie z pokoju po do³¹czeniu
  + mo¿liwoœæ do³¹czenia do pokoju jak by³y dwie osoby ju¿ (joinBtn)
  + schowanie waiting for enemy jak inny gracz nacisn¹³ ready i wyszed³
  
DO ZROBIENIA
 
- usuwanie pokojów po grze

- wyœwietlanie koordynatów przy mapce
- kogo kolej? (bootstrap alert info)
- ikonki - strza³, pud³o, traf, zatopienie
- zaznaczanie pokojów w których jest wojna
- refactoring nazw zmiennych,
- poprawa mniejszych i wiêkszych bugów
- wygl¹d aplikacji

Nie korzystam z oryginalnych socketowych pokojów poniewa¿ zda³em sobie sprawê z mo¿liwoœci ich
wykorzystania dopiero gdy dosz³o do obs³ugi strza³ów u¿ytkowników. Przyznajê, ¿e moje rozwi¹zanie
jest bardziej ³opatologiczne, ale co najwa¿niejsze - dzia³a.

