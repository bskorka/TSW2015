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
  + zablokowanie strzelania na planszy / usuni�cie plansz
  + Wy�wietlenie wyniku w pojawiaj�cym si� divie - (isReady: false)
  + zablokowanie obracania i przenoszenia statk�w po rozpocz�ciu gry
  + wy�wietlenie komunikatu o rewan� - je�li dw�ch ch�tnych (isReady) i znowu etap ustawiania statk�w
+ glyphicon do obrotu statk�w
+ obs�uga wyj�cia z pokoju
  + obs�uga wyj�cia u�ytkownika i czyszczenie pokoju, �eby nie blokowa�
  + przy okazji ogarni�cie disconnecta po zako�czeniu gry, bo na razie to przycisk bez u�ycia
  + kiedy drugi gracz klika disconnect to wtedy wychodzi z pokoju, a gracz, kt�ry chcia� rewan�
    dostaje o tym informacj� i wy�wietla si� przycisk powrotu do listy pokoj�w
  + wyj�cie z pokoju po do��czeniu
  + mo�liwo�� do��czenia do pokoju jak by�y dwie osoby ju� (joinBtn)
  + schowanie waiting for enemy jak inny gracz nacisn�� ready i wyszed�
  
DO ZROBIENIA
 
- usuwanie pokoj�w po grze

- wy�wietlanie koordynat�w przy mapce
- kogo kolej? (bootstrap alert info)
- ikonki - strza�, pud�o, traf, zatopienie
- zaznaczanie pokoj�w w kt�rych jest wojna
- refactoring nazw zmiennych,
- poprawa mniejszych i wi�kszych bug�w
- wygl�d aplikacji

Nie korzystam z oryginalnych socketowych pokoj�w poniewa� zda�em sobie spraw� z mo�liwo�ci ich
wykorzystania dopiero gdy dosz�o do obs�ugi strza��w u�ytkownik�w. Przyznaj�, �e moje rozwi�zanie
jest bardziej �opatologiczne, ale co najwa�niejsze - dzia�a.

