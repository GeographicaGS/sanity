
DROP TYPE IF EXISTS tStepIntDiseases CASCADE;

create type tStepIntDiseases as (d timestamp , v int);


create or replace function diseasesPoxBySteps(start timestamp,finish timestamp,nsteps numeric) 
    returns setof tStepIntDiseases as $$
DECLARE
    r RECORD;
    nseconds int;
    vinterval interval;
    previous_date timestamp;
    total int;
    inter int;
BEGIN
    nseconds :=  extract(epoch from (finish - start));

    vinterval := (nseconds/(nsteps-1) || ' seconds')::interval;

    total := 0;
    
    FOR r in select * FROM generate_series(start,finish,vinterval) LOOP

        if r.generate_series = start then
            --inter := (SELECT count(cartodb_id) FROM diseases_pox WHERE date_disease<start)::int;
            inter := 0;
        else
            inter := (SELECT count(cartodb_id) FROM diseases_pox WHERE date_disease>=previous_date AND date_disease<r.generate_series)::int;
        end if;
        
        total := total + inter;

        RETURN QUERY SELECT r.generate_series::timestamp,total;
        previous_date := r.generate_series;
    
    END LOOP;

END
$$
LANGUAGE plpgsql;

select * from diseasesPoxBySteps('2013-01-01 00:00:00'::timestamp,'2013-12-31 23:59:59'::timestamp,6);


