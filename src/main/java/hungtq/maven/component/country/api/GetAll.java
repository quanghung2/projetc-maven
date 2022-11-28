package hungtq.maven.component.country.api;

import hungtq.maven.component.country.domain.Country;
import hungtq.maven.component.country.domain.CountryRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("getAllCountry")
@RequestMapping(path = "api/v1/private/countries")
public class GetAll {
    @Autowired
    CountryRepo countryRepo;

    @GetMapping
    public Iterable<Country> getAllCountries() {
        return countryRepo.findAll();
    }
}
