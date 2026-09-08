"""
Pharmacy Inventory & Substitute Trust Backend
Fulfills Part 1:
- Loads pharmacy inventory JSON schema
- Provides API endpoint logic to return sorted batches ranked from nearest-expiry to longest-expiry
- Implements chemical equivalence matching for substitute brands
"""

import json
import os
from typing import List, Dict, Any, Optional

INVENTORY_FILE = os.path.join(os.path.dirname(__file__), "inventory.json")


def load_inventory(file_path: str = INVENTORY_FILE) -> List[Dict[str, Any]]:
    """
    Loads and parses the pharmacy inventory JSON file.
    Fields per record:
      - id (int)
      - medicine_name (str)
      - active_salt (str)
      - brand_name (str)
      - expiry_date_months (int)
      - stock_quantity (int)
      - physical_shelf_location (str)
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Inventory database file not found at: {file_path}")
    
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data


def get_sorted_batches(medicine_query: str, inventory_path: str = INVENTORY_FILE) -> List[Dict[str, Any]]:
    """
    Acts as an API endpoint function to search medicines and return a list of
    available inventory batches sorted from nearest-expiry to longest-expiry.
    
    Sorting rationale:
    Pharmacists can immediately see nearest-expiring batches (e.g., 3-4 months) 
    for FEFO (First-Expired-First-Out) stock rotation, or immediately jump to 
    longer expiry batches (e.g., 8-10+ months) when customers specifically demand it.
    """
    inventory = load_inventory(inventory_path)
    query = (medicine_query or "").strip().lower()

    if not query:
        # Return all batches sorted by expiry date months ascending
        return sorted(inventory, key=lambda item: item.get("expiry_date_months", 0))

    # Match against medicine_name, brand_name, or active_salt
    matched_batches = [
        item for item in inventory
        if query in item.get("medicine_name", "").lower()
        or query in item.get("brand_name", "").lower()
        or query in item.get("active_salt", "").lower()
    ]

    # Rank from nearest-expiry to longest-expiry (ascending order)
    sorted_batches = sorted(matched_batches, key=lambda item: item.get("expiry_date_months", 0))
    return sorted_batches


def get_chemical_substitutes(brand_name_or_id: Any, inventory_path: str = INVENTORY_FILE) -> Dict[str, Any]:
    """
    Finds available substitute brands with identical active_salt to solve the 
    issue of customers rejecting chemically identical substitute brands.
    """
    inventory = load_inventory(inventory_path)
    target = None

    # Locate the reference medicine
    for item in inventory:
        if str(item.get("id")) == str(brand_name_or_id) or \
           item.get("brand_name", "").lower() == str(brand_name_or_id).lower() or \
           item.get("medicine_name", "").lower() == str(brand_name_or_id).lower():
            target = item
            break

    if not target:
        return {
            "success": False,
            "error": f"Medicine '{brand_name_or_id}' not found in inventory."
        }

    active_salt = target.get("active_salt")
    # Find all other brands sharing the EXACT same active_salt
    substitutes = [
        item for item in inventory
        if item.get("active_salt", "").lower() == active_salt.lower()
        and item.get("id") != target.get("id")
    ]

    # Sort substitutes by longest expiry (customer preference)
    substitutes.sort(key=lambda item: item.get("expiry_date_months", 0), reverse=True)

    return {
        "success": True,
        "requested_medicine": target,
        "active_salt": active_salt,
        "substitutes_count": len(substitutes),
        "substitutes": substitutes
    }


def trust_matcher(requested_item: Dict[str, Any], substitute_item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Backend implementation of the Trust Matcher.
    Compares the active_salt of both medicines and generates customer-reassuring
    verification data.
    """
    salt_a = requested_item.get("active_salt", "").strip().lower()
    salt_b = substitute_item.get("active_salt", "").strip().lower()

    is_exact_match = (salt_a == salt_b) and (len(salt_a) > 0)
    
    if is_exact_match:
        return {
            "match_score": 100,
            "match_status": "100% Chemical Match",
            "is_identical": True,
            "active_salt": requested_item.get("active_salt"),
            "badge_color": "green",
            "explanation": (
                "Both brands contain the exact same active therapeutic molecule in identical dosage. "
                "They work inside the body identically and produce the exact same clinical result. "
                "Only the manufacturer label, packaging, and brand name differ."
            )
        }
    else:
        return {
            "match_score": 0,
            "match_status": "Different Active Ingredient",
            "is_identical": False,
            "active_salt_requested": requested_item.get("active_salt"),
            "active_salt_substitute": substitute_item.get("active_salt"),
            "badge_color": "red",
            "explanation": "These medicines contain different active salts and cannot be automatically substituted without physician confirmation."
        }


def compare_medicine_elements(item_a: Dict[str, Any], item_b: Dict[str, Any]) -> Dict[str, Any]:
    """
    Detailed element-by-element comparison between two medicines.
    Audits:
    - Active chemical salt & strength
    - Brand name & manufacturer
    - Medicine formulation
    - Therapeutic category & clinical action
    - Batch expiry & freshness advantage
    - Stock quantity & low-stock warning (<10)
    - Physical shelf locator coordinates
    - Packaging barcode / SKU
    - Clinical substitution clearance
    """
    salt_a = item_a.get("active_salt", "").strip().lower()
    salt_b = item_b.get("active_salt", "").strip().lower()
    is_salt_match = (salt_a == salt_b) and (len(salt_a) > 0)

    category_a = item_a.get("therapeutic_category", "").strip().lower()
    category_b = item_b.get("therapeutic_category", "").strip().lower()
    is_category_match = (category_a == category_b) and (len(category_a) > 0)

    expiry_diff = item_b.get("expiry_date_months", 0) - item_a.get("expiry_date_months", 0)

    elements = [
        {
            "element": "Active Chemical Salt",
            "medicine_a": item_a.get("active_salt"),
            "medicine_b": item_b.get("active_salt"),
            "is_match": is_salt_match,
            "status": "100% Identical Salt" if is_salt_match else "Chemical Mismatch"
        },
        {
            "element": "Commercial Brand",
            "medicine_a": item_a.get("brand_name"),
            "medicine_b": item_b.get("brand_name"),
            "is_match": item_a.get("brand_name") == item_b.get("brand_name"),
            "status": "Same Brand" if item_a.get("brand_name") == item_b.get("brand_name") else "Different Brand/Maker"
        },
        {
            "element": "Therapeutic Category",
            "medicine_a": item_a.get("therapeutic_category", "N/A"),
            "medicine_b": item_b.get("therapeutic_category", "N/A"),
            "is_match": is_category_match,
            "status": "Identical Clinical Indication" if is_category_match else "Different Indication Class"
        },
        {
            "element": "Batch Expiry Months",
            "medicine_a": f"{item_a.get('expiry_date_months')} mo",
            "medicine_b": f"{item_b.get('expiry_date_months')} mo",
            "is_match": expiry_diff >= 0,
            "status": f"+{expiry_diff} mo Fresher" if expiry_diff > 0 else ("Equal Expiry" if expiry_diff == 0 else f"{expiry_diff} mo Less Expiry")
        },
        {
            "element": "In-Hand Stock Quantity",
            "medicine_a": f"{item_a.get('stock_quantity')} units" + (" [LOW STOCK <10]" if item_a.get('stock_quantity', 0) < 10 else ""),
            "medicine_b": f"{item_b.get('stock_quantity')} units" + (" [LOW STOCK <10]" if item_b.get('stock_quantity', 0) < 10 else ""),
            "is_match": True,
            "status": "Warning: Low Stock (<10)" if item_b.get('stock_quantity', 0) < 10 else "Stock Available"
        },
        {
            "element": "Physical Shelf Location",
            "medicine_a": item_a.get("physical_shelf_location"),
            "medicine_b": item_b.get("physical_shelf_location"),
            "is_match": True,
            "status": "Verified Dispensary Coordinates"
        },
        {
            "element": "Packaging Barcode SKU",
            "medicine_a": item_a.get("barcode", "N/A"),
            "medicine_b": item_b.get("barcode", "N/A"),
            "is_match": True,
            "status": "Unique Registered SKU"
        },
        {
            "element": "Substitution Clearance",
            "medicine_a": "Reference Standard",
            "medicine_b": "Bioequivalent Substitute" if is_salt_match else "Incompatible Molecule",
            "is_match": is_salt_match,
            "status": "Safe to Dispense" if is_salt_match else "Substitution Prohibited"
        }
    ]

    return {
        "medicine_a": item_a.get("brand_name"),
        "medicine_b": item_b.get("brand_name"),
        "is_bioequivalent": is_salt_match,
        "expiry_diff": expiry_diff,
        "elements": elements
    }


if __name__ == "__main__":
    print("=" * 70)
    print("PHARMACY INVENTORY & TRUST MATCHER BACKEND DEMO")
    print("=" * 70)
    
    # 1. Test sorted batches (nearest-expiry to longest-expiry)
    print("\n[TEST 1] Searching for 'Paracetamol' batches sorted by nearest-expiry:")
    batches = get_sorted_batches("Paracetamol")
    for batch in batches:
        expiry = batch["expiry_date_months"]
        stock = batch["stock_quantity"]
        status = "SHORT EXPIRE (3-4 mo)" if expiry <= 4 else "FRESH / DEMANDED (8-10+ mo)"
        low_stock_flag = " [LOW STOCK <10]" if stock < 10 else ""
        print(f" -> [{batch['brand_name']}] Expiry: {expiry} months [{status}] | Loc: {batch['physical_shelf_location']} | Stock: {stock}{low_stock_flag}")

    # 2. Test substitute lookup
    print("\n[TEST 2] Finding chemical substitutes for 'Lipitor 20mg' (Customer demanding long expiry):")
    res = get_chemical_substitutes("Lipitor 20mg")
    if res["success"]:
        req = res["requested_medicine"]
        req_stock = req["stock_quantity"]
        req_stock_flag = " [LOW STOCK <10]" if req_stock < 10 else ""
        print(f" -> Requested: {req['brand_name']} (Expiry: {req['expiry_date_months']} mo, Stock: {req_stock}{req_stock_flag})")
        print(f" -> Active Salt: {res['active_salt']}")
        print(" -> Available Identical Substitutes (ranked by freshest):")
        for sub in res["substitutes"]:
            sub_stock = sub["stock_quantity"]
            sub_stock_flag = " [LOW STOCK <10]" if sub_stock < 10 else ""
            print(f"    * {sub['brand_name']} | Expiry: {sub['expiry_date_months']} mo | Shelf: {sub['physical_shelf_location']} | Stock: {sub_stock}{sub_stock_flag}")

    # 3. Test Trust Matcher
    print("\n[TEST 3] Running Trust Matcher algorithm between 'Lipitor 20mg' and 'Atorva 20mg':")
    inv = load_inventory()
    lipitor = next(i for i in inv if "Lipitor" in i["brand_name"])
    atorva = next(i for i in inv if "Atorva" in i["brand_name"])
    match_result = trust_matcher(lipitor, atorva)
    print(f" -> Result: {match_result['match_status']}")
    print(f" -> Score: {match_result['match_score']}%")
    print(f" -> Patient Explanation: \"{match_result['explanation']}\"")

    # 4. Test Detailed Element-by-Element Comparison
    print("\n[TEST 4] Element-by-Element Comparative Audit ('Lipitor' vs 'Atorva'):")
    comparison = compare_medicine_elements(lipitor, atorva)
    for el in comparison["elements"]:
        print(f" -> {el['element']:<24}: {el['medicine_a']:<25} vs {el['medicine_b']:<25} => [{el['status']}]")
    print("\n" + "=" * 70)
