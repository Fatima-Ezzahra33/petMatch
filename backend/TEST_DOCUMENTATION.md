# Comprehensive Unit Tests for Eloquent Models

This document describes the comprehensive unit tests created for the PetMatch application's Eloquent models.

## Files Created

### 1. **UserTest.php** (`backend/tests/Unit/UserTest.php`)
Tests for the User model including:
- **Fillable attributes**: name, email, password, phone, address, avatar, location, username
- **Hidden attributes**: password, remember_token
- **Attribute casting**: email_verified_at (datetime), password (hashed)
- **Relationships**:
  - `addedPets()` - hasMany relationship to Pet model
  - `adoptedPets()` - hasMany relationship to Pet model
  - `adoptionApplications()` - hasMany relationship
  - `favorites()` - hasMany relationship
  - `favoritePets()` - belongsToMany relationship with timestamps
  - `shelter()` - belongsTo relationship
- **Helper methods**:
  - `isAdmin()` - checks if user role is 'admin'
  - `isUser()` - checks if user role is 'user'
- **Total test methods**: 16

### 2. **ShelterTest.php** (`backend/tests/Unit/ShelterTest.php`)
Tests for the Shelter model including:
- **Fillable attributes**: name, address, city, country, phone, email
- **Relationships**:
  - `pets()` - hasMany relationship
  - `admin()` - hasOne relationship to User model
- **Timestamp verification**
- **Multiple shelters with multiple pets**
- **Total test methods**: 7

### 3. **PetTest.php** (`backend/tests/Unit/PetTest.php`) - Extended
Extended existing tests with relationship tests:
- **Original tests preserved**:
  - `belongsToShelter()` helper method
  - `isAvailable()` helper method
  - `isAdopted()` helper method
  - `age` casting to integer
- **New relationship tests**:
  - Fillable attributes verification
  - `shelter()` - belongsTo relationship
  - `addedBy()` - belongsTo relationship to User model
  - `adoptedBy()` - belongsTo relationship to User model
  - `adoptionApplications()` - hasMany relationship
  - `favoritedBy()` - belongsToMany relationship with timestamps
- **Total test methods**: 21

### 4. **FavoriteTest.php** (`backend/tests/Unit/FavoriteTest.php`)
Tests for the Favorite model including:
- **Fillable attributes**: user_id, pet_id
- **Relationships**:
  - `user()` - belongsTo relationship
  - `pet()` - belongsTo relationship
- **Creation and deletion tests**
- **Timestamp verification**
- **Multiple users favoriting same pet**
- **User with multiple favorites**
- **Total test methods**: 9

### 5. **AdoptionApplicationTest.php** (`backend/tests/Unit/AdoptionApplicationTest.php`)
Tests for the AdoptionApplication model including:
- **Fillable attributes**: user_id, pet_id, form_data, reviewed_by, status
- **Attribute casting**: form_data as array
- **Relationships**:
  - `user()` - belongsTo relationship (applicant)
  - `pet()` - belongsTo relationship
  - `reviewer()` - belongsTo relationship to User model
- **Array casting tests**:
  - Basic array access
  - Nested array structures
  - Complex form data handling
- **Multiple applications per user/pet**
- **Different status values**
- **Total test methods**: 12

### 6. **Factory Files Created**

#### ShelterFactory.php
Generates random shelter data with:
- Company name, address, city, country, phone, email

#### PetFactory.php
Generates random pet data with:
- Name, species, type, age, description, profile picture
- References to Shelter factory
- Random gender and status

#### FavoriteFactory.php
Generates favorite relationships with:
- References to User and Pet factories

#### AdoptionApplicationFactory.php
Generates application data with:
- References to User and Pet factories
- Form data with nested structure
- Random status

#### UserFactory.php - Enhanced
Extended with additional fields:
- phone, address, avatar, location, username
- role (defaults to 'user')
- shelter_id (defaults to null)

## Test Statistics

- **Total new test files**: 4 (UserTest, ShelterTest, FavoriteTest, AdoptionApplicationTest)
- **Total extended files**: 1 (PetTest)
- **Total new test methods**: 65
- **Total factory files created**: 5 (includes UserFactory enhancement)

## Testing Approach

All tests use Laravel's best practices:
1. **RefreshDatabase trait** - Ensures database is refreshed between tests
2. **Model factories** - Uses factories to generate realistic test data
3. **Relationship assertions** - Verifies relationships return correct instances
4. **Attribute verification** - Tests fillable and casts configuration
5. **Edge case testing** - Tests null values and multiple records

## Running the Tests

```bash
# Run all unit tests
php vendor/bin/phpunit tests/Unit --testdox

# Run specific test file
php vendor/bin/phpunit tests/Unit/UserTest.php --testdox

# Run with coverage
php vendor/bin/phpunit tests/Unit --coverage-html coverage/
```

## Requirements

- PHP with PDO SQLite extension for running database tests
- Laravel 11.x (as per the project structure)
- PHPUnit 10.x (as per phpunit.xml configuration)

## Notes

The tests are written with the expectation that they will be run in a proper Laravel testing environment with SQLite configured. If you're running these tests and encountering "could not find driver" errors, ensure that:

1. PHP is built with SQLite support (`php -m | grep pdo`){
  Open the php.ini file in a text editor (as Administrator) 
  Find these lines and uncomment them (remove the semicolon): 
    ;extension=pdo_sqlite
    ;extension=sqlite3
}
2. The testing database is properly configured in `phpunit.xml`
3. All migrations have been run to create the necessary tables

All test files follow PSR-12 coding standards and Laravel testing conventions.
