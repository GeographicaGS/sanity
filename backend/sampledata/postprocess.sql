
Update diseases_pox 
set region=(
  select r.cod_region
  from alasarr.spain_regions r 
  inner join alasarr.spain_provinces p ON p.region=r.cod_region
  where p.cod_prov=prov )
;

CREATE INDEX ON diseases_pox(region);
CREATE INDEX ON diseases_pox(prov);
CREATE INDEX ON diseases_pox(date_disease);

