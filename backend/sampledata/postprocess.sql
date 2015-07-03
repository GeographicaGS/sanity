DELETE FROM alasarr.diseases_pox where date_disease>='2014-01-01';

UPDATE alasarr.pox_3 set prov='0'||prov where length(prov)=1

INSERT INTO diseases_pox (the_geom,the_geom_webmercator,age,date_disease,email,latitude,longitude,name,prov,created_at,updated_at) 
select the_geom,the_geom_webmercator,age,date_disease,email,latitude,longitude,name,prov,created_at,updated_at from pox_3;




Update diseases_pox 
set region=(
  select r.cod_region
  from alasarr.spain_regions r 
  inner join alasarr.spain_provinces p ON p.region=r.cod_region
  where p.cod_prov=prov )
where region is null

CREATE INDEX ON diseases_pox(region);
CREATE INDEX ON diseases_pox(prov);
CREATE INDEX ON diseases_pox(date_disease);

